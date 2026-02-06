import { Devvit } from '@devvit/public-api';

// Configure the app with required permissions
Devvit.configure({
    redditAPI: true,
    redis: true, // For storing seen posts and conversation state
    http: true,  // For Discord webhook notifications
});

// --- Configuration ---
const KEYWORDS = [
    'commission',
    'sales rep',
    'remote work',
    'freelance',
    'side hustle',
    'earn money',
    'work from home',
    'closer',
    'appointment setter',
];

// --- Helper Functions ---

/**
 * Check if text contains any of the target keywords
 */
function containsKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Shared logic to scan subreddits for leads
 */
async function scanSubreddits(context: any) {
    console.log('Running post monitor...');
    const redis = context.redis;
    const reddit = context.reddit;

    // Get Discord webhook from settings
    const webhookUrl = await context.settings.get<string>('discordWebhook');

    // Get subreddits from backend settings
    let subredditsToMonitor = [
        'sales',
        'freelance_sales',
        'sidehustle',
        'remotejobs',
        'forhire',
        'workfromhome',
    ];

    const backendUrl = await context.settings.get<string>('backendUrl');
    if (backendUrl) {
        try {
            const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/settings/monitored_subreddits`);
            if (response.ok) {
                const data: any = await response.json();
                if (data && data.list && data.list.length > 0) {
                    subredditsToMonitor = data.list;
                    console.log(`Using targeted subreddits from dashboard: ${subredditsToMonitor.join(', ')}`);
                }
            }
        } catch (e) {
            console.error('Failed to fetch subreddits from backend, using defaults:', e);
        }
    }

    for (const subredditName of subredditsToMonitor) {
        try {
            // Use getNewPosts directly from reddit client
            const posts = await reddit.getNewPosts({
                subredditName: subredditName,
                limit: 10,
            });

            // Iterate through posts using the listing
            for await (const post of posts) {
                // Check if we've already seen this post
                const seenKey = `seen_post:${post.id}`;
                const alreadySeen = await redis.get(seenKey);

                if (alreadySeen) continue;

                // Check if post matches our keywords
                const fullText = `${post.title} ${post.body || ''}`;
                if (containsKeywords(fullText)) {
                    console.log(`Found matching post: ${post.title}`);

                    // Store the lead
                    const leadData = {
                        id: post.id,
                        title: post.title,
                        body: post.body || '',
                        subreddit: subredditName,
                        author: post.authorName,
                        url: post.url,
                        score: 95,
                        created_at: new Date().toISOString(),
                    };
                    await redis.set(`lead:${post.id}`, JSON.stringify(leadData));

                    // Sync with Dashboard Backend
                    if (backendUrl) {
                        try {
                            await fetch(`${backendUrl.replace(/\/$/, '')}/api/collector/lead`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(leadData),
                            });
                            console.log('Synced lead with dashboard');
                        } catch (e) {
                            console.error('Dashboard sync failed:', e);
                        }
                    }

                    // Send Discord notification
                    if (webhookUrl) {
                        const notification = `🚨 **New Lead Found!**\n**Subreddit:** r/${subredditName}\n**Title:** ${post.title}\n**Author:** u/${post.authorName}\n**URL:** ${post.url}`;
                        try {
                            await fetch(webhookUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: notification }),
                            });
                        } catch (e) {
                            console.error('Discord notification failed:', e);
                        }
                    }
                }

                // Mark as seen (expire after 7 days)
                await redis.set(seenKey, 'true', { expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
            }
        } catch (error) {
            console.error(`Error monitoring r/${subredditName}:`, error);
        }
    }
}

// --- Scheduled Job: Monitor Posts ---
Devvit.addSchedulerJob({
    name: 'monitorPosts',
    onRun: async (event, context) => {
        await scanSubreddits(context);
    },
});

// --- Scheduled Job: Check DMs ---
Devvit.addSchedulerJob({
    name: 'checkDMs',
    onRun: async (event, context) => {
        console.log('Checking DMs...');
        const reddit = context.reddit;
        const redis = context.redis;
        const webhookUrl = await context.settings.get<string>('discordWebhook');

        // AUTO-REPLY TOGGLE: Set to false to disable auto-replies
        const AUTO_REPLY_ENABLED = false;

        try {
            // Get unread messages
            const messages = await reddit.getMessages({ type: 'unread' });

            for await (const message of messages) {
                // Get sender - from can be user or subreddit
                const fromData = message.from;
                const sender = fromData.type === 'user' ? fromData.username : (fromData as any).name || '';
                const messageId = message.id;

                if (!sender) continue;

                // Check if human takeover is active for this user
                const takeoverKey = `takeover:${sender}`;
                const isHumanTakeover = await redis.get(takeoverKey);

                if (isHumanTakeover) {
                    console.log(`Human takeover active for ${sender}, skipping auto-reply`);
                    continue;
                }

                // Check if we already replied to this message
                const repliedKey = `replied:${messageId}`;
                const alreadyReplied = await redis.get(repliedKey);
                if (alreadyReplied) continue;

                // --- Auto Reply Logic ---
                const responseText = `Hi! Thanks for reaching out. 

I'm an AI assistant helping with initial inquiries. A team member will follow up with you shortly.

In the meantime, here's some quick info:
- This is a 100% commission-based remote role
- Average earnings: $4,000 - $8,000/month
- Payments are made weekly

Feel free to ask any questions!

*(This is an automated message)*`;

                if (AUTO_REPLY_ENABLED) {
                    // Send reply
                    await reddit.sendPrivateMessage({
                        to: sender,
                        subject: 'Re: Your Message',
                        text: responseText,
                    });

                    console.log(`Replied to DM from ${sender}`);

                    // Mark as replied
                    await redis.set(repliedKey, 'true', { expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
                } else {
                    console.log(`Auto-reply disabled. Skipping reply to ${sender}`);
                    // We DO NOT mark as repliedKey here, so if we re-enable it later, we might reply? 
                    // Or should we mark it as 'processed' but not replied?
                    // For now, let's mark it as replied in Redis so we don't spam logs or send it later when we turn it on.
                    // Actually, the user might want to reply manually. Let's mark it as 'seen_but_muted'.
                    await redis.set(repliedKey, 'muted', { expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
                }

                // Store conversation
                const convoKey = `conversation:${sender}`;
                const existingConvo = await redis.get(convoKey);
                const messages_list = existingConvo ? JSON.parse(existingConvo) : [];
                messages_list.push({
                    role: 'user',
                    content: message.body,
                    timestamp: new Date().toISOString(),
                });

                if (AUTO_REPLY_ENABLED) {
                    messages_list.push({
                        role: 'assistant',
                        content: responseText,
                        timestamp: new Date().toISOString(),
                    });
                } else {
                    // Log that we stayed silent
                    messages_list.push({
                        role: 'system',
                        content: "(Auto-reply disabled)",
                        timestamp: new Date().toISOString(),
                    });
                }

                await redis.set(convoKey, JSON.stringify(messages_list));

                // Sync with Dashboard Backend
                const backendUrl = await context.settings.get<string>('backendUrl');
                if (backendUrl) {
                    try {
                        await fetch(`${backendUrl.replace(/\/$/, '')}/api/collector/conversation`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                username: sender,
                                last_message: message.body || '',
                                history: JSON.stringify(messages_list),
                                timestamp: new Date().toISOString(),
                            }),
                        });
                    } catch (e) {
                        console.error('Conversation sync failed:', e);
                    }
                }

                // Send Discord notification
                if (webhookUrl) {
                    const statusMsg = AUTO_REPLY_ENABLED ? "**AI Reply:** Sent standard intro" : "**AI Reply:** Disabled (Silent)";
                    const notification = `💬 **New DM from u/${sender}**\n\n**User:** ${message.body?.substring(0, 200)}...\n\n${statusMsg}`;
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: notification }),
                        });
                    } catch (e) {
                        console.error('Discord notification failed:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking DMs:', error);
        }
    },
});

// --- App Settings ---
Devvit.addSettings([
    {
        type: 'string',
        name: 'discordWebhook',
        label: 'Discord Webhook URL',
        helpText: 'Enter your Discord webhook URL for notifications',
    },
    {
        type: 'string',
        name: 'backendUrl',
        label: 'Dashboard Backend URL',
        helpText: 'Public URL of your Python backend (e.g. from ngrok or Render)',
    },
]);

// --- Menu Actions ---

// 1. Manual Scrape Trigger
Devvit.addMenuItem({
    label: 'Scrape Subreddits Now',
    location: 'subreddit',
    onPress: async (event, context) => {
        context.ui.showToast('Starting manual scrape...');
        await scanSubreddits(context);
        context.ui.showToast('Manual scrape complete!');
    },
});

// 2. Start Background Jobs
Devvit.addMenuItem({
    label: 'Start Lead Monitor',
    location: 'subreddit',
    onPress: async (event, context) => {
        await context.scheduler.runJob({
            name: 'monitorPosts',
            cron: '*/5 * * * *', // Every 5 minutes
        });
        await context.scheduler.runJob({
            name: 'checkDMs',
            cron: '* * * * *', // Every minute
        });
        context.ui.showToast('Background jobs started.');
    },
});

// 3. Stop Background Jobs
Devvit.addMenuItem({
    label: 'Stop Lead Monitor',
    location: 'subreddit',
    onPress: async (event, context) => {
        const jobs = await context.scheduler.listJobs();
        for (const job of jobs) {
            await context.scheduler.cancelJob(job.id);
        }
        context.ui.showToast('Background jobs stopped.');
    },
});

export default Devvit;

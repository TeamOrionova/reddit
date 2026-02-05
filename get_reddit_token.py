import praw
import random
import socket
import sys

def receive_connection():
    """Wait for and then return a connected socket..
    Opens a TCP connection on port 8080, and waits for a single client.
    """
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    
    # Check if port 8080 is available, if not try others or warn user
    try:
        server.bind(('localhost', 8080))
    except OSError:
        print("Error: Port 8080 is in use. Please ensure no other service is using port 8080.")
        print("Note: Your Reddit App Redirect URI must match exactly.")
        sys.exit(1)
        
    server.listen(1)
    client = server.accept()[0]
    server.close()
    return client

def send_message(client, message):
    """Send message to client and close the connection."""
    print(message)
    client.send(f"HTTP/1.1 200 OK\r\n\r\n{message}".encode('utf-8'))
    client.close()

def main():
    print("--- Reddit Refresh Token Generator ---")
    print("1. Go to https://www.reddit.com/prefs/apps")
    print("2. Click 'create another app' button at the bottom")
    print("3. Select 'script'")
    print("4. For 'redirect uri', enter: http://localhost:8080")
    print("5. Click 'create app'")
    print("--------------------------------------")
    
    client_id = input("Enter your Client ID (string under the app name): ").strip()
    client_secret = input("Enter your Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("Error: Client ID and Secret are required.")
        return

    # User Agent is required
    user_agent = f"TokenGenerator/1.0 by RandomUser_{random.randint(1000,9999)}"

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri="http://localhost:8080",
        user_agent=user_agent
    )

    # Scopes required for the bot
    scopes = ["identity", "read", "privatemessages", "submit", "history"]
    
    state = str(random.randint(0, 65000))
    url = reddit.auth.url(scopes, state, "permanent")
    
    print("\n--------------------------------------")
    print(f"Please open this URL in your browser to authorize:")
    print(f"\n{url}\n")
    print("--------------------------------------")
    print("Waiting for you to click 'Allow' in the browser...")

    client = receive_connection()
    data = client.recv(1024).decode('utf-8')
    
    # Parse the code from the callback
    param_tokens = data.split(' ', 2)[1].split('?', 1)[1].split('&')
    params = {key: value for (key, value) in [token.split('=') for token in param_tokens]}

    if state != params['state']:
        send_message(client, "State mismatch error! Please try again.")
        return
    
    if 'error' in params:
        send_message(client, f"Error: {params['error']}")
        return

    code = params['code']
    
    try:
        refresh_token = reddit.auth.authorize(code)
        send_message(client, f"Success! Your Refresh Token is: {refresh_token}")
        
        print("\n🎉 SUCCESS! Here are your credentials for .env:")
        print("--------------------------------------")
        print(f"REDDIT_CLIENT_ID={client_id}")
        print(f"REDDIT_CLIENT_SECRET={client_secret}")
        print(f"REDDIT_REFRESH_TOKEN={refresh_token}")
        print(f"REDDIT_USERNAME={reddit.user.me().name}")
        print("--------------------------------------")
        print("Copy these into your .env file now.")
        
    except Exception as e:
        send_message(client, f"Error authorizing: {e}")
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

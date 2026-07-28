#!/usr/bin/env python3
import sys, json, struct, os, subprocess

CONFIG_DIR = os.path.expanduser("~/Library/Application Support/OpenInProfile")
CONFIG_FILE = os.path.join(CONFIG_DIR, "profiles.json")

# Native host protocol version. Bump when the message protocol changes so the
# extension can prompt users to reinstall an out-of-date companion app.
# v2: added get_settings/set_settings for cross-profile settings sync.
HOST_VERSION = 2

def read_message():
    raw_len = sys.stdin.buffer.read(4)
    if len(raw_len) < 4:
        return None
    msg_len = struct.unpack('<I', raw_len)[0]
    raw_msg = sys.stdin.buffer.read(msg_len)
    return json.loads(raw_msg.decode('utf-8'))

def send_message(obj):
    msg = json.dumps(obj).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(msg)))
    sys.stdout.buffer.write(msg)
    sys.stdout.buffer.flush()

def read_config():
    # Returns a dict {profiles: [...], settings: {...}}.
    # Legacy files stored a bare list of profiles — normalise those.
    if not os.path.exists(CONFIG_FILE):
        return {}
    try:
        with open(CONFIG_FILE, 'r') as f:
            data = json.load(f)
        if isinstance(data, list):
            return {'profiles': data}
        return data if isinstance(data, dict) else {}
    except:
        return {}

def write_config(config):
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def get_profiles():
    return read_config().get('profiles', [])

def save_profiles(profiles):
    config = read_config()
    config['profiles'] = profiles
    write_config(config)

def get_settings():
    return read_config().get('settings', {})

def save_settings(settings):
    config = read_config()
    config['settings'] = settings
    write_config(config)

def detect_profiles():
    local_state_path = os.path.expanduser(
        "~/Library/Application Support/Google/Chrome/Local State"
    )
    if not os.path.exists(local_state_path):
        return []
    try:
        with open(local_state_path, 'r') as f:
            state = json.load(f)
        info_cache = state.get('profile', {}).get('info_cache', {})
        detected = []
        for dir_name, info in info_cache.items():
            if dir_name in ('System Profile', 'Guest Profile'):
                continue
            display_name = (info.get('gaia_name') or info.get('name') or dir_name)
            detected.append({'name': display_name, 'dir': dir_name})
        return detected
    except:
        return []

def find_chrome():
    paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        os.path.expanduser('~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    ]
    return next((p for p in paths if os.path.exists(p)), None)

def open_url(profile, url):
    chrome = find_chrome()
    if not chrome:
        return False
    subprocess.Popen([chrome, f'--profile-directory={profile}', url])
    return True

msg = read_message()
if not msg:
    send_message({'status': 'error', 'message': 'No message received'})
    sys.exit(1)

action = msg.get('action')

if action == 'ping':
    send_message({'status': 'ok', 'version': HOST_VERSION})
elif action == 'get_profiles':
    send_message({'status': 'ok', 'profiles': get_profiles()})
elif action == 'set_profiles':
    try:
        save_profiles(msg.get('profiles', []))
        send_message({'status': 'ok'})
    except Exception as e:
        send_message({'status': 'error', 'message': str(e)})
elif action == 'get_settings':
    send_message({'status': 'ok', 'settings': get_settings()})
elif action == 'set_settings':
    try:
        save_settings(msg.get('settings', {}))
        send_message({'status': 'ok'})
    except Exception as e:
        send_message({'status': 'error', 'message': str(e)})
elif action == 'detect_profiles':
    send_message({'status': 'ok', 'detected': detect_profiles()})
elif action == 'open_url':
    if open_url(msg.get('profile', ''), msg.get('url', '')):
        send_message({'status': 'ok'})
    else:
        send_message({'status': 'error', 'message': 'Chrome not found'})
else:
    send_message({'status': 'error', 'message': f'Unknown action: {action}'})

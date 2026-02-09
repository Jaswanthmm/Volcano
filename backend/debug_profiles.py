from app import app
import json

def debug_endpoints():
    client = app.test_client()
    
    # 1. Test Alien Profile
    print("\n--- Testing Alien Profile API ---")
    response = client.get('/api/users/alien/ALIEN-P7JM')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success! Name:", response.json.get('username'))
    else:
        print("Error:", response.json)

    # 2. Test Company Profile
    print("\n--- Testing Company Profile API ---")
    response = client.get('/api/companies/5/profile')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success! Name:", response.json.get('name'))
    else:
        print("Error:", response.json)

    # 3. Test Alien Dashboard Data (My Ideas)
    print("\n--- Testing Alien Dashboard API ---")
    response = client.get('/api/ideas/my?identifier=ALIEN-P7JM')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Ideas Found: {len(response.json)}")
    else:
        print("Error:", response.json)

if __name__ == "__main__":
    debug_endpoints()

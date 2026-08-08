import requests

BASE_URL = "http://localhost:8000"

def run_test():
    # 1. Login Receptionist
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "reception@demo.com", "password": "Reception@123"})
    rec_token = res.json()["access_token"]
    
    # Get Entities
    headers_rec = {"Authorization": f"Bearer {rec_token}"}
    entities = requests.get(f"{BASE_URL}/entities", headers=headers_rec).json()
    entity_id = entities[0]["_id"]
    
    # Get Hosts
    hosts = requests.get(f"{BASE_URL}/entities/{entity_id}/employees", headers=headers_rec).json()
    host_id = hosts[0]["_id"]
    host_email = hosts[0]["email"]
    
    # 2. Register Visitor
    visitor_data = {
        "name": "Test Visitor",
        "mobile": "9876543210",
        "purpose": "Testing",
        "entity_id": entity_id,
        "host_employee_id": host_id
    }
    # Since it requires a file upload, we need to send multipart/form-data
    files = {"photo": ("test.jpg", b"fake_image_data", "image/jpeg")}
    res = requests.post(f"{BASE_URL}/visitors", data=visitor_data, files=files, headers=headers_rec)
    visitor_id = res.json()["_id"]
    print(f"Created visitor {visitor_id}")
    
    # 3. Login Employee
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": host_email, "password": "Employee@123"})
    emp_token = res.json()["access_token"]
    headers_emp = {"Authorization": f"Bearer {emp_token}"}
    
    # 4. Decline Visitor
    print(f"Declining visitor {visitor_id} with host {host_id} ({host_email})")
    res = requests.patch(f"{BASE_URL}/visitors/{visitor_id}/decline", headers=headers_emp)
    print("Decline Response Status:", res.status_code)
    print("Decline Response Body:", res.text)

if __name__ == "__main__":
    run_test()

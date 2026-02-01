import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {resp.status_code}")
        print(resp.json())
        return resp.status_code == 200
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return False

def test_cancer():
    url = f"{BASE_URL}/api/risk/predict/cancer/"
    data = {
        "Age": 30,
        "Number_of_sexual_partners": 2,
        "First_sexual_intercourse": 18,
        "Num_of_pregnancies": 1,
        "Smokes": 0,
        "Smokes_years": 0,
        "Smokes_packs_year": 0,
        "Hormonal_Contraceptives": 1,
        "Hormonal_Contraceptives_years": 1,
        "IUD": 0,
        "IUD_years": 0,
        "STDs": 0,
        "STDs_number": 0,
        "STDs_condylomatosis": 0,
        "STDs_cervical_condylomatosis": 0,
        "STDs_vaginal_condylomatosis": 0,
        "STDs_vulvo_perineal_condylomatosis": 0,
        "STDs_syphilis": 0,
        "STDs_pelvic_inflammatory_disease": 0,
        "STDs_genital_herpes": 0,
        "STDs_molluscum_contagiosum": 0,
        "STDs_AIDS": 0,
        "STDs_HIV": 0,
        "STDs_Hepatitis_B": 0,
        "STDs_HPV": 0,
        "STDs_Number_of_diagnosis": 0,
        "Dx_Cancer": 0,
        "Dx_CIN": 0,
        "Dx_HPV": 0,
        "Dx": 0
    }
    try:
        print(f"Testing Cancer API: {url}")
        resp = requests.post(url, json=data)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Response:", json.dumps(resp.json(), indent=2))
        else:
            print("Error:", resp.text)
        return resp.status_code == 200
    except Exception as e:
        print(f"Cancer Test Failed: {e}")
        return False

if __name__ == "__main__":
    if test_health():
        test_cancer()
    else:
        print("Skipping Cancer Test due to Health Check failure")

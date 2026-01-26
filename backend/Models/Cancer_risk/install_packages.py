import subprocess
import sys

packages = ['matplotlib', 'seaborn']

print("Installing required packages...")
for package in packages:
    print(f"\nInstalling {package}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✓ {package} installed successfully")
    except Exception as e:
        print(f"✗ Error installing {package}: {e}")

print("\n" + "="*50)
print("Installation complete!")
print("Please restart your Jupyter kernel and try again.")
print("="*50)

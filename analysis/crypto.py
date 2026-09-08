import os
import base64
import hmac
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

VERSION_PREFIX = "v1"

def _get_field_encryption_key() -> bytes:
    key_b64 = os.environ.get("FIELD_ENCRYPTION_KEY")
    if not key_b64:
        raise ValueError("FIELD_ENCRYPTION_KEY environment variable is not set")
    key = base64.b64decode(key_b64)
    if len(key) != 32:
        raise ValueError("FIELD_ENCRYPTION_KEY must be exactly 32 bytes when decoded")
    return key

def _get_search_hmac_key() -> bytes:
    key_b64 = os.environ.get("SEARCH_HMAC_KEY")
    if not key_b64:
        raise ValueError("SEARCH_HMAC_KEY environment variable is not set")
    key = base64.b64decode(key_b64)
    if len(key) != 32:
        raise ValueError("SEARCH_HMAC_KEY must be exactly 32 bytes when decoded")
    return key

def generate_hmac(plaintext: str) -> str:
    h = hmac.new(_get_search_hmac_key(), plaintext.encode('utf-8'), hashlib.sha256)
    return base64.b64encode(h.digest()).decode('utf-8')

def encrypt(plaintext: str, queryable: bool = False) -> str:
    if plaintext is None:
        return plaintext
        
    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(_get_field_encryption_key()), modes.GCM(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    
    ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
    auth_tag = encryptor.tag
    
    hmac_section = generate_hmac(plaintext) if queryable else ""
    
    return f"{VERSION_PREFIX}:{hmac_section}:{base64.b64encode(iv).decode('utf-8')}:{base64.b64encode(ciphertext).decode('utf-8')}:{base64.b64encode(auth_tag).decode('utf-8')}"

def decrypt(encrypted_value: str) -> str:
    if not encrypted_value or not isinstance(encrypted_value, str):
        return encrypted_value
        
    if not encrypted_value.startswith(f"{VERSION_PREFIX}:"):
        return encrypted_value
        
    parts = encrypted_value.split(":")
    if len(parts) != 5:
        raise ValueError("Invalid encrypted format")
        
    _, _, iv_b64, ciphertext_b64, auth_tag_b64 = parts
    
    iv = base64.b64decode(iv_b64)
    ciphertext = base64.b64decode(ciphertext_b64)
    auth_tag = base64.b64decode(auth_tag_b64)
    
    cipher = Cipher(algorithms.AES(_get_field_encryption_key()), modes.GCM(iv, auth_tag), backend=default_backend())
    decryptor = cipher.decryptor()
    
    try:
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        return plaintext.decode('utf-8')
    except Exception as e:
        raise ValueError("Decryption failed. Authentication tag mismatch or wrong key.") from e

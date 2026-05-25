# JWT 生成和验证工具

这是一个简单的Python工具，用于生成和验证JWT（JSON Web Token）令牌。

请根据以下head和payload生成jwt,并满足下列需求
head
{
    "alg": "EdDSA",
    "kid": "TKB32P7AC2"
}

payload
{
    "sub": "3AE3TCARBK",
    "iat": 1757046509,
    "exp": 1757047000
}

将Header和Payload分别进行Base64URL编码并用英文句号拼接在一起，使用你的私钥对其进行Ed25519算法的签名，之后对签名结果同样进行Base64URL编码
最后，请将Base64URL编码后的Header、Payload和Signature使用英文句号拼接在一起，组合为最终的Token，即 header.payload.signature


## 安装依赖

在使用此工具前，请先安装必要的依赖：

```bash
pip install PyJWT
```

## 使用方法

### 作为命令行工具使用

#### 生成JWT令牌

```bash
python jwt_generator.py generate --payload '{"user_id": 123, "username": "test_user"}' --secret "your-secret-key"
```
python jwt_generator.py generate --payload '{"user_id": 123, "username": "test_user"}' --secret "your-secret-key"
可选参数：
- `--exp`: 令牌过期时间（分钟），默认30分钟
- `--alg`: 签名算法，默认HS256

#### 验证JWT令牌

```bash
python jwt_generator.py verify --token "your-jwt-token" --secret "your-secret-key"
```

### 作为Python模块导入使用

```python
from jwt_generator import generate_jwt, verify_jwt

# 生成令牌
payload = {"user_id": 123, "username": "test_user"}
secret_key = "your-secret-key"
token = generate_jwt(payload, secret_key)
print(token)

# 验证令牌
try:
    decoded_payload = verify_jwt(token, secret_key)
    print("验证成功:", decoded_payload)
except Exception as e:
    print("验证失败:", str(e))
```

## 功能特点

- 支持JWT令牌的生成和验证
- 自动处理令牌过期时间
- 提供命令行接口和Python API
- 支持自定义签名算法
- 详细的错误处理和提示
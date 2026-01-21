import numpy as np
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware # <--- Import this

app = FastAPI()
# --- ADD THIS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    # The list of origins that are allowed to make requests
    allow_origins=["http://localhost:5173"], 
    
    # Allow cookies/auth headers (if you need them later)
    allow_credentials=True,
    
    # Allow all HTTP methods (GET, POST, etc.)
    allow_methods=["*"],
    
    # Allow all headers
    allow_headers=["*"],
)
# ----------------------

@app.get("/weather-data")
def get_weather_binary():
    # 1. Generate Dummy Data (1000x1000 float32)
    # In real life, load this from xarray/netcdf
    x = np.linspace(-10, 10, 1000).astype(np.float32)
    y = np.linspace(-10, 10, 1000).astype(np.float32)
    X, Y = np.meshgrid(x, y)
    
    # Sombrero function again, as an example
    R = np.sqrt(X**2 + Y**2)
    Z = np.sin(R) / (R + 0.1)  # Weather Data (e.g. Temperature)
    
    # 2. Flatten to 1D Array
    # 'C' order (Row-major) is standard for C/JS
    flat_data = Z.ravel(order='C') 
    
    # 3. Return Raw Bytes
    # content-type application/octet-stream tells browser it's binary
    return Response(content=flat_data.tobytes(), media_type="application/octet-stream")
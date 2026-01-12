#!/usr/bin/env python3
"""Test backend import and startup"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "lifeos_backend"))

try:
    print("[TEST] Importando main...")
    from lifeos_backend import main
    print("[TEST] Main importado com sucesso!")
    
    print("[TEST] Verificando app...")
    app = main.app
    print("[TEST] App encontrado!")
    
    print("[TEST] Verificando se há erros no startup...")
    # Try to load the files
    financeiro = main.load_financeiro()
    print(f"[TEST] Financeiro carregado: {financeiro}")
    
    print("[TEST] Tudo OK!")
    
except Exception as e:
    print(f"[ERROR] {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()

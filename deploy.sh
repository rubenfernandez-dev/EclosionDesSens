#!/bin/bash

# Script de despliegue para Éclosion des sens
# Ejecutar con: bash deploy.sh

echo "🌿 Éclosion des sens - Script de Despliegue"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra package.json${NC}"
    echo "Por favor, ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js está instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor, instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar npm
echo "📦 Verificando npm..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm está instalado: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

# Verificar MySQL
echo "🗄️  Verificando MySQL..."
if command_exists mysql; then
    echo -e "${GREEN}✅ MySQL está instalado${NC}"
else
    echo -e "${YELLOW}⚠️  MySQL no está disponible en PATH${NC}"
    echo "Asegúrate de que MySQL esté instalado y configurado"
fi

# Verificar archivo .env
echo ""
echo "🔐 Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado${NC}"
    echo "Creando desde .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Archivo .env creado${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edita el archivo .env con tus datos reales${NC}"
    else
        echo -e "${RED}❌ No se encuentra .env.example${NC}"
        exit 1
    fi
fi

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"
else
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

# Preguntar si iniciar el servidor
echo ""
echo "=========================================="
read -p "¿Deseas iniciar el servidor ahora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[SsYy]$ ]]; then
    echo ""
    echo "🚀 Iniciando servidor..."
    echo "Servidor disponible en: http://localhost:4000"
    echo "Presiona Ctrl+C para detener"
    echo ""
    npm start
fi

echo ""
echo -e "${GREEN}✅ Script completado${NC}"

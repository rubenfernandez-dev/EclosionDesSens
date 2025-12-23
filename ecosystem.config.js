module.exports = {
  apps: [{
    name: 'eclosion-des-sens',
    script: './src/server.js',
    
    // Instancias (1 para aplicaciones pequeñas, "max" para usar todos los CPUs)
    instances: 1,
    exec_mode: 'fork',
    
    // Auto-restart
    autorestart: true,
    watch: false,
    
    // Límites de memoria
    max_memory_restart: '500M',
    
    // Variables de entorno
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    
    // Logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Estrategia de restart
    min_uptime: '10s',
    max_restarts: 10,
    
    // Opciones adicionales
    merge_logs: true,
    time: true
  }]
};

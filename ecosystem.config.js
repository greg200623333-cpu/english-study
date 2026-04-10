module.exports = {
  apps: [{
    name: 'english-study',
    script: '.next/standalone/server.js', 
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '1400M',  
    instances: 1,                 
    exec_mode: 'fork'
  }]
}
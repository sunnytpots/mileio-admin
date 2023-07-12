module.exports = {
  apps: [
    {
      name: 'crm',
      exec_mode: 'cluster',
      script: 'yarn',
      args: 'start'
    }
  ]
}

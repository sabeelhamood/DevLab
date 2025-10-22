import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Server, Database, Cpu, Memory, Network, AlertTriangle, CheckCircle } from 'lucide-react'

export default function SystemMonitoring() {
  const mockSystemMetrics = {
    cpu: {
      usage: 45,
      cores: 8,
      load: [0.8, 0.6, 0.4]
    },
    memory: {
      used: 6.2,
      total: 16,
      percentage: 38.75
    },
    disk: {
      used: 120,
      total: 500,
      percentage: 24
    },
    network: {
      inbound: 125.5,
      outbound: 89.3,
      connections: 245
    }
  }

  const mockServices = [
    {
      name: 'API Server',
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '120ms',
      lastCheck: '2 minutes ago'
    },
    {
      name: 'Database',
      status: 'healthy',
      uptime: '99.8%',
      responseTime: '45ms',
      lastCheck: '1 minute ago'
    },
    {
      name: 'AI Service',
      status: 'warning',
      uptime: '98.5%',
      responseTime: '250ms',
      lastCheck: '3 minutes ago'
    },
    {
      name: 'File Storage',
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '80ms',
      lastCheck: '1 minute ago'
    }
  ]

  const mockAlerts = [
    {
      id: '1',
      type: 'warning',
      message: 'High CPU usage detected',
      timestamp: '10 minutes ago',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      message: 'Database backup completed',
      timestamp: '1 hour ago',
      resolved: true
    },
    {
      id: '3',
      type: 'error',
      message: 'AI service timeout',
      timestamp: '2 hours ago',
      resolved: true
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-600">Monitor system performance and health</p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Cpu className="h-6 w-6 text-primary-600 mr-2" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <span className="text-2xl font-bold">{mockSystemMetrics.cpu.usage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${mockSystemMetrics.cpu.usage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {mockSystemMetrics.cpu.cores} cores • Load: {mockSystemMetrics.cpu.load.join(', ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Memory className="h-6 w-6 text-success-600 mr-2" />
                <span className="font-medium">Memory</span>
              </div>
              <span className="text-2xl font-bold">{mockSystemMetrics.memory.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-success-600 h-2 rounded-full" 
                style={{ width: `${mockSystemMetrics.memory.percentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {mockSystemMetrics.memory.used}GB / {mockSystemMetrics.memory.total}GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Database className="h-6 w-6 text-warning-600 mr-2" />
                <span className="font-medium">Disk Usage</span>
              </div>
              <span className="text-2xl font-bold">{mockSystemMetrics.disk.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-warning-600 h-2 rounded-full" 
                style={{ width: `${mockSystemMetrics.disk.percentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {mockSystemMetrics.disk.used}GB / {mockSystemMetrics.disk.total}GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Network className="h-6 w-6 text-purple-600 mr-2" />
                <span className="font-medium">Network</span>
              </div>
              <span className="text-2xl font-bold">{mockSystemMetrics.network.connections}</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>In: {mockSystemMetrics.network.inbound} MB/s</div>
              <div>Out: {mockSystemMetrics.network.outbound} MB/s</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Monitor all system services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockServices.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {service.status === 'healthy' && (
                        <CheckCircle className="h-5 w-5 text-success-600" />
                      )}
                      {service.status === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-warning-600" />
                      )}
                      {service.status === 'error' && (
                        <AlertTriangle className="h-5 w-5 text-error-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">
                        Uptime: {service.uptime} • Response: {service.responseTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      service.status === 'healthy' 
                        ? 'text-success-600' 
                        : service.status === 'warning'
                        ? 'text-warning-600'
                        : 'text-error-600'
                    }`}>
                      {service.status}
                    </div>
                    <div className="text-xs text-gray-500">{service.lastCheck}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Recent system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {alert.type === 'error' && (
                      <AlertTriangle className="h-5 w-5 text-error-600" />
                    )}
                    {alert.type === 'warning' && (
                      <AlertTriangle className="h-5 w-5 text-warning-600" />
                    )}
                    {alert.type === 'info' && (
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{alert.message}</h3>
                      {alert.resolved && (
                        <span className="text-xs bg-success-100 text-success-800 px-2 py-1 rounded">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Overall system health and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Server className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Overall Status</h3>
              <p className="text-2xl font-bold text-success-600">Healthy</p>
              <p className="text-sm text-gray-600">All systems operational</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Cpu className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <p className="text-2xl font-bold text-primary-600">Good</p>
              <p className="text-sm text-gray-600">Within normal parameters</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Storage</h3>
              <p className="text-2xl font-bold text-warning-600">24%</p>
              <p className="text-sm text-gray-600">120GB of 500GB used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

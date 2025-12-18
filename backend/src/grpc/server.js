import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import path from 'path'
import { fileURLToPath } from 'url'
import processHandler from './handlers/processHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * GRPC Server for Microservice
 */
class GrpcServer {
  constructor() {
    this.server = null
    this.port = process.env.GRPC_PORT || 50051
  }

  /**
   * Start GRPC server
   */
  async start() {
    try {
      console.log('🚀 [GRPC] Starting GRPC server', {
        service: process.env.SERVICE_NAME || 'devlab-backend',
        port: this.port
      })

      // Load proto file
      const PROTO_PATH = path.join(__dirname, '../../proto/microservice.proto')
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      })

      // Load package
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
      const microservice = protoDescriptor.microservice.v1

      // Create server
      this.server = new grpc.Server()

      // Register Process handler
      this.server.addService(microservice.MicroserviceAPI.service, {
        Process: processHandler.handle.bind(processHandler)
      })

      // Bind and start
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            console.error('❌ [GRPC] Failed to start GRPC server', {
              service: process.env.SERVICE_NAME || 'devlab-backend',
              error: error.message
            })
            throw error
          }

          console.log('✅ [GRPC] GRPC server started', {
            service: process.env.SERVICE_NAME || 'devlab-backend',
            port: port
          })
        }
      )

    } catch (error) {
      console.error('❌ [GRPC] GRPC server startup failed', {
        service: process.env.SERVICE_NAME || 'devlab-backend',
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Shutdown GRPC server
   */
  async shutdown() {
    if (this.server) {
      console.log('🛑 [GRPC] Shutting down GRPC server', {
        service: process.env.SERVICE_NAME || 'devlab-backend'
      })

      return new Promise((resolve) => {
        this.server.tryShutdown(() => {
          console.log('✅ [GRPC] GRPC server shut down', {
            service: process.env.SERVICE_NAME || 'devlab-backend'
          })
          resolve()
        })
      })
    }
  }
}

export default new GrpcServer()


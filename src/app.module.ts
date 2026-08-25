import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SharedLoggerModule, SharedHealthModule } from 'core-shared-nestjs';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Load biến môi trường
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cấu hình TypeORM theo Code-First
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASS', 'postgres'),
        database: configService.get<string>('DB_NAME', 'order_db'),
        autoLoadEntities: true,

        // CẢNH BÁO KIẾN TRÚC:
        // synchronize: true tự động sinh bảng dựa trên Entities.
        // CHỈ NÊN DÙNG TRONG MÔI TRƯỜNG DEV.
        // Lên Production (hoặc Sprint sau) bắt buộc phải dùng Migrations.
        synchronize: false,
      }),
    }),

    // Cấu hình Kafka Client
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'order-service',
              brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
            },
            consumer: {
              groupId: 'order-consumer-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    // Shared modules
    SharedLoggerModule,
    SharedHealthModule,

    OrdersModule,
  ],
})
export class AppModule {}

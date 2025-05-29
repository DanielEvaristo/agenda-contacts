// src/contacts/contacts.service.ts

import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { TableClient } from '@azure/data-tables';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

// Nombre de la tabla en Azure
const tableName = 'Contacts';


@Injectable()
export class ContactsService {
  private readonly client: TableClient;
  private readonly partitionKey = 'contactsPK';

  constructor() {
    // Inicializa el cliente usando la connection string personalizada
    const connectionString = process.env.TABLE_CONNECTION_STRING;
    if (!connectionString) {
      throw new InternalServerErrorException(
        'Falta configurar TABLE_CONNECTION_STRING en las variables de entorno'
      );
    }
    this.client = TableClient.fromConnectionString(connectionString, tableName);
  }

  /** Lista todos los contactos */
  async findAll(): Promise<{ id: string; name: string; email: string }[]> {
    const entities = this.client.listEntities();
    const result: { id: string; name: string; email: string }[] = [];
    for await (const e of entities) {
      result.push({
        id: e.rowKey!,
        name: e.name as string,
        email: e.email as string,
      });
    }
    return result;
  }

  /** Obtiene un contacto por su RowKey */
  async findOne(id: string): Promise<{ id: string; name: string; email: string }> {
    try {
      const e = await this.client.getEntity(this.partitionKey, id);
      return {
        id: e.rowKey!,
        name: e.name as string,
        email: e.email as string,
      };
    } catch {
      throw new NotFoundException('Contacto no encontrado');
    }
  }

  /** Crea un nuevo contacto */
  async create(dto: CreateContactDto): Promise<{ id: string; name: string; email: string }> {
    const rowKey = Date.now().toString();
    try {
      await this.client.createEntity({
        partitionKey: this.partitionKey,
        rowKey,
        name: dto.name,
        email: dto.email,
      });
      return { id: rowKey, name: dto.name, email: dto.email };
    } catch (err) {
      console.error('Error creando entidad en Table Storage:', err);
      throw new InternalServerErrorException('No se pudo crear el contacto');
    }
  }

  /** Actualiza un contacto existente (merge de propiedades) */
  async update(id: string, dto: UpdateContactDto): Promise<{ id: string; name: string; email: string }> {
    try {
      await this.client.upsertEntity(
        {
          partitionKey: this.partitionKey,
          rowKey: id,
          name: dto.name,
          email: dto.email,
        },
        'Merge'
      );
      return this.findOne(id);
    } catch {
      throw new NotFoundException('Contacto no encontrado');
    }
  }

  /** Elimina un contacto */
  async remove(id: string): Promise<void> {
    try {
      await this.client.deleteEntity(this.partitionKey, id);
    } catch {
      throw new NotFoundException('Contacto no encontrado');
    }
  }
}
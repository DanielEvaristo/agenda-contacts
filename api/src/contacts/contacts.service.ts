import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

const DATA_FILE = join(process.cwd(), 'src', 'data', 'contacts.json');

@Injectable()
export class ContactsService {
  private async readAll() {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as any[];
  }
  private async writeAll(list: any[]) {
    await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  }

  async findAll() {
    return this.readAll();
  }

  async findOne(id: string) {
    const all = await this.readAll();
    const item = all.find(c => c.id === id);
    if (!item) throw new NotFoundException('Contacto no encontrado');
    return item;
  }

  async create(dto: CreateContactDto) {
    const all = await this.readAll();
    const newItem = { id: Date.now().toString(), ...dto };
    all.push(newItem);
    await this.writeAll(all);
    return newItem;
  }

  async update(id: string, dto: UpdateContactDto) {
    const all = await this.readAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx < 0) throw new NotFoundException('Contacto no encontrado');
    all[idx] = { ...all[idx], ...dto };
    await this.writeAll(all);
    return all[idx];
  }

  async remove(id: string) {
    const all = await this.readAll();
    const filtered = all.filter(c => c.id !== id);
    if (filtered.length === all.length)
      throw new NotFoundException('Contacto no encontrado');
    await this.writeAll(filtered);
  }
}
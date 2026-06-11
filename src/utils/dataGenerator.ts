export class DataGenerator {
  // Случайная строка
  static randomString(length = 8) {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
  }

  // username = буквы + 4 цифры
  static generateUsername() {
    const letters = this.randomString(5);
    const numbers = Math.floor(Math.random() * 10000);
    return `${letters}${numbers}`;
  }

  // email = username + @domain
  static generateEmail(domain: string) {
    const username = this.generateUsername();
    const email = `${username}@${domain}`;
    return { username, email };
  }

  // US phone: +1201XXXXXXX
  static generatePhoneNumber(): string {
    const suffix = Math.floor(Math.random() * 9_000_000 + 1_000_000);
    return `+1201${suffix}`;
  }
}


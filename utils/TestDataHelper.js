export class TestDataHelper {
  static uniqueEmail(prefix = 'bytepe') {
    return `${prefix}.${Date.now()}@example.test`;
  }

  static formatCardExpiry(month, year) {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  }
}

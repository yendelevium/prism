import { requestParser } from './variableParser';

describe('requestParser', () => {
    it('should return original string if no variables match', () => {
        const input = 'https://api.example.com/users';
        const variables = { BASE_URL: 'http://localhost' };
        expect(requestParser(input, variables)).toBe(input);
    });

    it('should replace a single variable', () => {
        const input = '{{BASE_URL}}/users';
        const variables = { BASE_URL: 'https://api.example.com' };
        expect(requestParser(input, variables)).toBe('https://api.example.com/users');
    });

    it('should replace multiple variables', () => {
        const input = '{{BASE_URL}}/users/{{USER_ID}}';
        const variables = {
            BASE_URL: 'https://api.example.com',
            USER_ID: '123'
        };
        expect(requestParser(input, variables)).toBe('https://api.example.com/users/123');
    });

    it('should handle whitespace inside brackets', () => {
        const input = '{{  BASE_URL  }}/users';
        const variables = { BASE_URL: 'https://api.example.com' };
        expect(requestParser(input, variables)).toBe('https://api.example.com/users');
    });

    it('should leave unknown variables as is', () => {
        const input = '{{UNKNOWN_VAR}}/data';
        const variables = { KNOWN: 'value' };
        expect(requestParser(input, variables)).toBe('{{UNKNOWN_VAR}}/data');
    });

    it('should handle empty input', () => {
        expect(requestParser('', {})).toBe('');
    });
});

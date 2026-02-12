import { requestParser } from '../variableParser';

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

    it('should replace the same variable multiple times', () => {
        const input = '{{VAR}}/path/{{VAR}}';
        const variables = { VAR: 'value' };
        expect(requestParser(input, variables)).toBe('value/path/value');
    });

    it('should handle special characters in values', () => {
        const input = '{{URL}}?query={{PARAM}}';
        const variables = {
            URL: 'https://example.com/api/v1',
            PARAM: 'special&value=true'
        };
        expect(requestParser(input, variables)).toBe('https://example.com/api/v1?query=special&value=true');
    });

    it('should leave unknown variables as is', () => {
        const input = '{{UNKNOWN_VAR}}/data';
        const variables = { KNOWN: 'value' };
        expect(requestParser(input, variables)).toBe('{{UNKNOWN_VAR}}/data');
    });

    it('should handle adjacent variables correctly', () => {
        const input = '{{FIRST}}{{SECOND}}';
        const variables = { FIRST: 'Hello', SECOND: 'World' };
        expect(requestParser(input, variables)).toBe('HelloWorld');
    });

    it('should not replace partial matches or invalid variable names', () => {
        // Based on regex [a-zA-Z0-9_]+
        const input = '{{valid_var}} {{invalid-var}}';
        const variables = { valid_var: 'OK', 'invalid-var': 'FAIL' };
        // "invalid-var" won't match regex because of hyphen
        expect(requestParser(input, variables)).toBe('OK {{invalid-var}}');
    });

    it('should be case sensitive', () => {
        const input = '{{VAR}}';
        const variables = { var: 'lower', VAR: 'UPPER' };
        expect(requestParser(input, variables)).toBe('UPPER');
    });

    it('should handle empty input', () => {
        expect(requestParser('', {})).toBe('');
    });

    // Edge case: ensure it doesn't crash on null/undefined input if types were loose (TS handles this, but runtime check safety)
    it('should handle null/undefined input (if forced)', () => {
        // @ts-ignore
        expect(requestParser(null, {})).toBe(null);
        // @ts-ignore
        expect(requestParser(undefined, {})).toBe(undefined);
    });
});

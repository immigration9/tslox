import { Lox } from "./main";
import { Token, TokenType as TT } from "./token";

export class Scanner {
  private tokens: Token[];
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(private source: string) {
    this.tokens = [];
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TT.EOF, "", null, this.line));
    return this.tokens;
  }

  /**
   * Recognizing Lexemes
   */
  private scanToken() {
    /**
     * 현재 커서가 맞춰져 있는 글자를 반환한다.
     * `advance`가 수행된 다음에 커서는 증가되기 때문에
     * 현재 `c`에 할당되어 있는 글자는 커서보다 하나 이전 값이다.
     */
    const c = this.advance();

    // prettier-ignore
    switch (c) {
      case '(': this.addToken(TT.LEFT_PAREN); break;
      case ')': this.addToken(TT.RIGHT_PAREN); break;
      case '{': this.addToken(TT.LEFT_BRACE); break;
      case '}': this.addToken(TT.RIGHT_BRACE); break;
      case ',': this.addToken(TT.COMMA); break;
      case '.': this.addToken(TT.DOT); break;
      case '-': this.addToken(TT.MINUS); break;
      case '+': this.addToken(TT.PLUS); break;
      case ';': this.addToken(TT.SEMICOLON); break;
      case '*': this.addToken(TT.STAR); break; 

      case '!':
        this.addToken(this.match('=') ? TT.BANG_EQUAL : TT.BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? TT.EQUAL_EQUAL : TT.EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? TT.LESS_EQUAL : TT.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TT.GREATER_EQUAL : TT.GREATER);
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TT.SLASH);
        }
      case ' ':
      case '\r':
      case '\t':
        /**
         * 공백을 마주치면 스캔 반복의 처음으로 돌아간다
         * 즉, 공백 이후에는 새로운 어휘소를 시작한다.
         */
        break;
      case '\n':
        /**
         * 줄바꿈도 공백과 동일하다. 다만 줄 카운터를 증가한다
         * 그렇기에 `match`가 아닌 `peek`를 사용한 것이다
         * 줄바꿈은 여기서 별도로 처리 해줘야 하기 때문이다
         */
        this.line++;
        break;
      case '"': {
        this.string()
        break;
      }
      default: {
        if (this.isDigit(c)) {
          this.number();
        } else {
          Lox.error(this.line, "Unexpected character."); break;
        }
      }
    }
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }

  /**
   * 현재 커서가 맞춰져 있는 곳의 글자를 리턴한다.
   * 커서 위치를 하나 증가한다
   */
  private advance() {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TT, literal: unknown = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  /**
   * 현재 커서가 맞춰진 곳의 글자를 리턴한다.
   * advance와 달리 커서를 이동하지 않는다
   */
  private peek() {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  /**
   * . 뒤에 오는 최소 하나 이상의 숫자를 처리해야 하기 때문에
   * 현재 커서 이후의 글자를 피킹할 수 있는 메서드를 만들었다.
   */
  private peekNext() {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  /**
   * 현재 커서가 맞춰져 있는 곳의 글자가 제공한 글자와의 매칭 여부를 확인한다
   * 매칭되면 커서 위치를 하나 증가한다
   * 매칭되지 않으면 위치를 증가하지 않는다
   *
   * 엄밀히 말하자면 `advance`와 `peek`가 실질적인 작업을 수행하고
   * `match`는 그 둘을 조합한 개념이라고 보면 된다
   */
  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(this.line, "Unterminated string.");
      return;
    }

    // 닫는 " 글자에 대한 대응
    this.advance();

    // 양쪽에 있는 " 를 제외하고 토큰을 발행한다
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TT.STRING, value);
  }

  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  private number() {
    /**
     * 정수부를 찾는다
     */
    while (this.isDigit(this.peek())) this.advance();

    /**
     * 소수부를 찾는다
     */
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // . 글자를 처리한다
      this.advance();

      // 소수 부분을 처리한다
      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(
      TT.NUMBER,
      Number.parseFloat(this.source.substring(this.start, this.current))
    );
  }
}

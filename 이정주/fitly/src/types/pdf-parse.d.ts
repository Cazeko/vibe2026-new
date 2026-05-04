// pdf-parse@1.1.1의 deep import 경로에 대한 타입 선언.
// 본 모듈은 헌법 제19조(라이브러리 우선) 및 제24조(검증) 회피용 ENOENT 함정 우회 경로다.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}

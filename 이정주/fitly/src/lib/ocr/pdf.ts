// pdf-parse@1.1.1의 모듈 진입부에 자체 디버그 PDF 자동 로드 코드가 있어
// Next.js 빌드/런타임에서 ENOENT를 유발할 수 있다. 함수 모듈을 직접 deep-import 한다.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}

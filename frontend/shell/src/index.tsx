// Async boundary BẮT BUỘC cho MF host — bài học spike SF-1 (RUNTIME-006 loadShareSync):
// entry KHÔNG import shared/bootstrap tĩnh, phải qua dynamic import để MF share init xong trước.
import('./bootstrap');

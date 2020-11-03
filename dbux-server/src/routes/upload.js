
import * as uploadController from '../controllers/upload';

export async function upload(request, response) {
  uploadController.upload(request, response);
}
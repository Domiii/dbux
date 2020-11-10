
import * as uploadController from '../controllers/upload';

export async function upload(request, response) {
  await uploadController.upload(request, response);
}
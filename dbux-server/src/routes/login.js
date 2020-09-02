
import * as loginController from '../controllers/login';

export async function login(request, response) {
  await loginController.verify(request, response);
}
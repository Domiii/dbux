
import loginController from '../controllers/login';

export default async function login(request, response) {
  await loginController.verify(request, response);
}
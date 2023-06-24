import axios from "axios";

const BASE_URL = "https://sagip.cyclic.app";

export const request = async (url, method, headers = {}, body = {}) => {
  try {
    let response;

    switch (method) {
      case "GET":
        response = await axios.get(BASE_URL + url, { headers });
        break;

      case "POST":
        response = await axios.post(BASE_URL + url, body, { headers });
        break;

      case "PUT":
        response = await axios.put(BASE_URL + url, body, { headers });
        break;

      case "DELETE":
        response = await axios.delete(BASE_URL + url, { headers });
        break;

      default:
        return;
    }

    const { data, status } = response;
    return data;
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      return data;
    } else if (error.request) {
      const errorMessage = "No response received from the server";
      return { message: errorMessage, success: false };
    } else {
      const errorMessage = error.message;
      return { message: errorMessage, success: false };
    }
  }
};

class ApiResponse {
  static success(data, pagination = null) {
    const response = {
      success: true,
      data
    };
    
    if (pagination) {
      response.pagination = pagination;
    }
    
    return response;
  }
  
  static error(message, errors = null) {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return response;
  }
}

module.exports = ApiResponse;
class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something Went Wrong",
        errors = [],
        statck = ""
    ){
        super(message)
        this.statusCode = statusCode,
        this.data = null,
        this.message = message, 
        this.success = this.success,
        this.errors = errors

        if (statck){
            this.statck = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError
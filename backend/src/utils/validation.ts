export const validateEmail = (email:string):boolean =>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const validateExpense = (data:any):string[]=>{
    const errors:string[] = [];

    if(!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
        errors.push("Amount must be a positive number");
    }

    if(!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
        errors.push("Category is required");
    }

    if(!data.description || data.description.trim().length === 0){
        errors.push("Description is required")
    }

    if(!data.date){
        errors.push("Date is required")
    }

    return errors;
}
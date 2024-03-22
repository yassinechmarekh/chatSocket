const mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    pseudo: String,
    pass: String
});

mongoose.model('user',userSchema);
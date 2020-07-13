const Password = require('node-php-password');
const md5Hex = require('md5-hex');
const PasswordHash = require('phpass').PasswordHash;
const argon2 = require('argon2');
const bcrypt = require('bcrypt');


const verifyPassword = async (password, hash) =>{

    var match = false;
    // If we are using phpass
    if (hash.indexOf('$P$') === 0)
    {
        // Use PHPass's portable hashes with a cost of 10.
        var phpass = new PasswordHash(10, true);
        var hash = phpass.hashPassword(password);
        match = phpass.checkPassword(password, hash);
    }
    // Check for Argon2id hashes
    else if (hash.indexOf('$argon2id') === 0)
    {
        // This implementation is not supported through any existing polyfills
        try {
            if (await argon2.verify(hash, password)) {
              // password match
              match = true;
            } else {
              // password did not match
              match = false;
            }
          } catch (err) {
            // internal failure
            match = false;
          }
    }
    // Check for Argon2i hashes
    else if (hash.indexOf('$argon2i') === 0)
    {
        // This implementation is not supported through any existing polyfills
        try {
            if (await argon2.verify(hash, password)) {
              // password match
              match = true;
            } else {
              // password did not match
              match = false;
            }
          } catch (err) {
            // internal failure
            match = false;
          }
    }
    // Check for bcrypt hashes
    else if ( hash.indexOf('$2') === 0 )
    {
        // \JCrypt::hasStrongPasswordSupport() includes a fallback for us in the worst case
        var temp = hash.replace("$2y$", "$2a$");
        match = bcrypt.compareSync(password, temp);
        // match = bcrypt.compareSync(password, hash);
    }

    var passArr = hash.split(":");
    if (passArr.length > 1) {
        // Check the password
        var hash = passArr[0];
        var salt = passArr[1];
        var crypto = md5Hex(password + salt);
        if(crypto == hash) {
            match = true;
        }
    }

    return match;
    
}

module.exports = verifyPassword;
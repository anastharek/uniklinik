const cryptography = {
    /**
     * GET encrypted key
     * @returns 
     */
    encrypt(id,type,duration){
    const encryptOptions={
          method:'POST',
          headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
          },
          body:JSON.stringify({id,type,duration})
    }

    return fetch('/api/crypto/encrypt', encryptOptions).then((answer) => {
          if (!answer.ok) { throw answer }
          return answer.json()
    }).catch(error => {
          throw error
          })

    },
    /**
     * GET decrypted id
     * @returns 
     */
    decrypt(key){
    const dencryptOptions={
          method:'POST',
          headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8'
          },
          body:JSON.stringify({key})
    }

    return fetch('/api/crypto/decrypt', dencryptOptions).then((answer) => {
          if (!answer.ok) { throw answer }
          return answer.text()
    }).catch(error => {
          throw error
          })

    },

}

export default cryptography;
import service from './config'

export const updateUserLocation = (pos) => {
    return service.patch('/api/users/me', {
            location: {
                coordinates: [pos.lng, pos.lat]
            }
        })
        .then(result => {
            return result.data
        })
        .catch(error => {
            return error
        })
}

export const getCurrentUser = () => {
    return service.get('/api/users/me')
        .then(result => {
            return result.data
        })
        .catch(error => {
            return error
        })
}
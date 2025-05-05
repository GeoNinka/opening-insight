export async function validateUserRole() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;

    try {
        const resp = await fetch('http://localhost:5000/user/profile', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const user = await resp.json();
        return user.role === 'admin';
    } catch (err) {
        console.error('Ошибка при проверке роли:', err);
        return false;
    }
}
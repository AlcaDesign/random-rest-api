const elements = {
	header: document.getElementById('header'),
	userName: document.querySelector('#header-user #name'),
	userAvatar: document.querySelector('#header-user #avatar')
};

const searchParams = new URLSearchParams(location.hash.slice(1));
location.hash = '';
let token = searchParams.get('token');

if(token) {
	localStorage.setItem('auth-jwt-token', token);
}
else {
	token = localStorage.getItem('auth-jwt-token');
}

async function getUser() {
	const res = await fetch('/api/twitch/user', {
		headers: {
			Authorization: token
		}
	});
	return res.json();
}

function logout() {
	localStorage.clear();
	elements.header.classList.remove('show-user');
}

(async () => {
	if(!token) {
		return;
	}
	const { error, user } = await getUser();
	if(error) {
		return;
	}
	const { display_name, profile_image_url } = user;
	elements.header.classList.add('show-user');
	elements.userName.textContent = display_name;
	elements.userAvatar.style.backgroundImage = `url(${profile_image_url})`;
	console.log(user);
})();
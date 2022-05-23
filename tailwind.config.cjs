module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		fontFamily: {
			mono: ['Source Code Pro', 'monospace']
		},
		extend: {
			colors: {
				primary: 'var(--primary-color)',
				secondary: 'var(--secondary-color)',
				third: 'var(--tertiary-color)',
				header: 'var(--header)',
				accent: 'var(--accent-color)',
				text: 'var(--text-color)'
			}
		}
	},
	darkMode: 'class',
	plugins: [require('daisyui')]
};

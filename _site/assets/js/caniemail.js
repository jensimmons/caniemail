class Feature {

	constructor() {

		this.addEvent(document.querySelectorAll('.data-summary-family'));
	}

	addEvent(elements) {

		elements.forEach(element => {
			element.addEventListener('click', e => {

				e.preventDefault();

				//summary family
				let selected = e.currentTarget.parentNode.querySelector('.data-summary-family.selected');
				if(selected != null) {
					selected.classList.remove('selected');
				}
				e.currentTarget.classList.add('selected');

				// family
				e.currentTarget.closest('section').querySelectorAll('.data-details .data-family.selected').forEach(element => {
					element.classList.remove('selected');
				});

				const family = e.currentTarget.getAttribute('data-family');
				if(family != null) {
					e.currentTarget.closest('section').querySelector(`.data-details [data-family=${family}]`).classList.add('selected');
				}
				else {
					e.currentTarget.closest('section').querySelectorAll(`.data-details .data-family:not([data-family])`).forEach(element => {
						element.classList.add('selected');
					});
				}
			});
		});
	}
}

class Search {

	constructor() {

		this.data = null;
		this.term = null;
		this.results = null;
		this.input = document.querySelector('.caniemail-search-input');

		if(this.input != null) {

			this.input.addEventListener('focus', e => {
				this.loadJSONFile();
			});

			this.input.addEventListener('input', e => {

				if(!this.data) {
					this.loadJSONFile();
				}

				this.term = e.currentTarget.value;
				this.query();
			});

			const url = new URL(document.location.href);
			if(url.searchParams.get('s') != null) {

				if(!this.data) {
					this.loadJSONFile();
				}
				this.input.value = url.searchParams.get('s');
				this.term = url.searchParams.get('s');
				this.query();
			}


		}
	}

	loadJSONFile() {

		if(!this.data) {
			fetch('/assets/js/search.json')
			.then(response => {
				return response.json();
			})
			.then(json => {
				this.data = json;
				if(this.term) {
					this.query();
				}
			})
			.catch(error => {
				console.log(error);
			});
		}
	}

	query() {

		if(!this.data) {
			this.input.classList.add('caniemail-search-loading');
		}

		if(!this.term) {
			this.input.classList.remove('caniemail-search-loading');
			this.removeEmptyMessage();
			this.removeResultsContainer();
		}

		if(this.data && this.term) {
			this.results = this.data.filter(feature => feature.title.toLowerCase().includes(this.term.toLowerCase()) || feature.keywords.includes(this.term.toLowerCase()));
			this.input.classList.remove('caniemail-search-loading');

			if(this.results.length == 0) {
				this.buildEmptyMessage();
				this.removeResultsContainer();
			}
			else {
				this.removeEmptyMessage();
				this.buildResultsContainer();
				this.buildResults();
				this.updateURL();
			}
		}
	}

	removeEmptyMessage() {

		if(document.querySelector('[role=search] form .caniemail-search-empty') != null) {
			document.querySelector('[role=search] form .caniemail-search-empty').remove();
		}
	}

	buildEmptyMessage() {

		if(document.querySelector('[role=search] form .caniemail-search-empty') == null) {
			let noResult = document.createElement('p');
			noResult.classList.add('caniemail-search-empty');
			noResult.innerHTML = 'No results found.';
			document.querySelector('[role=search] form').appendChild(noResult);
		}
	}

	buildResultsContainer() {

		if(document.querySelector('[role=main] .caniemail-search-results') == null) {
			let container = document.createElement('div');
			container.classList.add('caniemail-search-results');
			container.id = 'caniemail-search-results';
			document.querySelector('[role=main]').prepend(container);
		}
	}

	removeResultsContainer() {

		if(document.querySelector('[role=main] .caniemail-search-results') != null) {
			document.querySelector('[role=main] .caniemail-search-results').remove();
		}
	}

	buildResults() {

		const container = document.querySelector('[role=main] .caniemail-search-results');
		container.querySelectorAll('section').forEach(section => {
			if(this.results.filter(feature => feature.url == section.getAttribute('data-url')).length == 0) {
				section.remove();
			}
		});

		this.results.forEach(feature => {
			if(container.querySelector(`[data-url="${feature.url}"]`) == null) {
				let div = document.createElement('div');
				div.innerHTML = `<section class="feature feature--placeholder" data-url="${feature.url}">
						<header class="feature-header">
							<h1 class="feature-title"><a href="${feature.url}">${feature.title}<span class="feature-permalink" aria-hidden="true">#</span></a></h1>
						</header>
						<div class="data"></div>
						<div class="data-details"></div>
						<footer class="feature-footer"></footer>
					</section>`;
				container.appendChild(div.firstChild);

				const featureContainer = container.querySelector(`[data-url="${feature.url}"]`);
				featureContainer.classList.add('loading');

				fetch(feature.url)
				.then(response => {
					return response.text();
				})
				.then(text => {
					let div = document.createElement('div');
					div.innerHTML = text;
					if(featureContainer != null) {
						featureContainer.classList.remove('loading');
						featureContainer.querySelector('.data').innerHTML = div.querySelector('.data').innerHTML;
						featureContainer.querySelector('.data-details').innerHTML = div.querySelector('.data-details').innerHTML;
						featureContainer.querySelector('.feature-footer').innerHTML = div.querySelector('.feature-footer').innerHTML;

						caniemail.feature.addEvent(featureContainer.querySelectorAll('.data .data-summary-family'));
					}
				})
				.catch(error => {
					console.log(error);
				});
			}
		});
	}

	updateURL() {

		history.pushState({id:'search'}, 'search', `${document.location.origin}/search/?s=${this.term}`);
	}
}

class Caniemail {

	constructor() {
		this.feature = new Feature();
		this.search = new Search();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	window['caniemail'] = new Caniemail();
});
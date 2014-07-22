var Networkteam = window.Networkteam||{};
Networkteam.OpenBadges = Networkteam.OpenBadges||{};

(function($) {

	Networkteam.OpenBadges.assertionStepValidated = function(badgeClassIdentifier, stepIdentifier, token) {
		window.localStorage.setItem(badgeClassIdentifier + ':' + stepIdentifier, token);
		$.event.trigger({
			type: 'OpenBadges:AssertionStepValidated',
			badgeClassIdentifier: badgeClassIdentifier,
			stepIdentifier: stepIdentifier,
			token: token
		});
	};

	$.fn.badgeRewardWidget = function(options) {
		var $this = $(this),
			$steps = $this.find('.openbadges-badge-assertion-steps'),
			badgeClassIdentifier = $this.find('.openbadges-badge').data('identifier'),
			badgeClassName = $this.find('.openbadges-badge').data('name'),
			nodeIdentifier = $this.data('identifier'),
			assertionSteps = {},
			assertionStepsCount;
		$steps.hide();

		$steps.find('li').each(function() {
			assertionSteps[$(this).data('identifier')] = {
				validated: false,
				token: null
			};
		});
		assertionStepsCount = $steps.find('li').length;

		$this.find('.openbadges-status-count').text(assertionStepsCount);

		if (completedAssertionSteps() === assertionStepsCount) {
			enableClaimButton();
		}

		$(document).on('OpenBadges:AssertionStepValidated', function(event) {
			if (event.badgeClassIdentifier === badgeClassIdentifier) {
				if (assertionSteps[event.stepIdentifier]) {
					assertionSteps[event.stepIdentifier].validated = true;
					assertionSteps[event.stepIdentifier].token = event.token;
				}

				$this.find('.openbadges-status-current').text(completedAssertionSteps());

				if (completedAssertionSteps() === assertionStepsCount) {
					showClaimBadgeModal();
					enableClaimButton();

					$.event.trigger({
						type: 'OpenBadges:AssertionsValidated',
						badgeClassIdentifier: badgeClassIdentifier,
						badgeClassName: badgeClassName
					});
				}
			}
		});

		$('.openbadges-reward-modal form').submit(function(e) {
			var $form = $(this);
			e.preventDefault();

			$.post($form.attr('action'), {
				badgeClass: badgeClassIdentifier,
				recipientEmail: $form.find('input[type="email"]').val(),
				tokens: $.map(assertionSteps, function(value) { return value.token; })
			}).done(function(result) {
				$form.fadeOut();
				showMessage('info', 'Sending your badge to Mozilla Backpack...');

				if (result.location) {
					OpenBadges.issue([result.location], function(errors, successes) {
						if (errors && errors[0]) {
							showMessage('danger', '<strong>Error!</strong> Badge could not be sent to Backpack: ' + errors[0].reason);
						} else {
							showMessage('success', '<strong>Success!</strong> Your badge was transferred. You can safely close this window.');

							$.event.trigger({
								type: 'OpenBadges:BadgeIssued',
								badgeClassIdentifier: badgeClassIdentifier,
								badgeClassName: badgeClassName
							});
						}
					});
				} else {
					showMessage('danger', '<strong>Error!</strong> No assertion location given. Please retry.');
				}
			}).fail(function() {
				showMessage('danger', '<strong>Error!</strong> There was an error claiming you badge. This can be caused by a timeout, please reload and try again!');
			}).always(function() {
				$form.find('.btn').button('reset');
			});

			$form.find('.btn').button('loading');

			return false;
		});

		function completedAssertionSteps() {
			var count = 0,
				identifier;
			for (identifier in assertionSteps) {
				if (assertionSteps.hasOwnProperty(identifier) && assertionSteps[identifier].validated) {
					count++;
				}
			}
			return count;
		}

		function enableClaimButton() {
			$this.find('.openbadges-claim-button').removeClass('disabled');
		}

		function showClaimBadgeModal() {
			$('#modal-' + nodeIdentifier).modal();
		}

		function showMessage(severity, message) {
			$('.openbadges-messages').empty().append($('<div class="alert alert-' + severity + '" role="alert">' + message + '</div>'));
		}
	};

	$('.openbadges-badge-reward').badgeRewardWidget();

})(jQuery);
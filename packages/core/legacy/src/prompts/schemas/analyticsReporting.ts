export default {
  properties: {
    analyticsResponse: {
      required: true,
      default: 'yes',
      description: `help us prioritize new features and bug fixes by enabling us to collect anonymous statistics about your usage.
would you like to help Arco with anonymous usage analytics? [yes(y)/no(n)]`,
      message: 'please choose yes or no.',
      type: 'string',
      conform(value: string) {
        return (
          value.toLowerCase() === 'y' ||
          value.toLowerCase() === 'n' ||
          value.toLowerCase() === 'yes' ||
          value.toLowerCase() === 'no'
        );
      },
    },
  },
};

import path from 'path';
import gql from 'graphql-tag';

import { Component } from '@aspect/component';
import { ComponentModel } from '@aspect/component/uiRuntime';

import { Doc } from './doc';
import { DocsMain } from './docs.main.runtime';

export default function (docs: DocsMain) {
  return {
    typeDefs: gql`
      extend type Component {
        description: String
        labels: [String]
        outline: [ComponentOutline]
        extraDocs: [ExtraDocItem]
      }

      type ExtraDocItem {
        title: String
        content: String
      }

      type ComponentOutline {
        depth: Int
        text: String
      }
    `,
    resolvers: {
      Component: {
        description: (component: Component): ComponentModel['description'] => {
          const doc = docs.getDoc(component);
          return doc?.description || '';
        },

        labels: (component: Component): ComponentModel['labels'] => {
          const doc = docs.getDoc(component);
          return Doc.mergeDocProperty(doc?.labels || [], component.labels);
        },

        outline: (component: Component): ComponentModel['outline'] => {
          const doc = docs.getDoc(component);
          return doc?.outline || [];
        },

        extraDocs: (component: Component): ComponentModel['extraDocs'] => {
          const results = [];
          component.entries.extraDocs.forEach(({ title, entry }) => {
            const file = component.files.find(
              (file) => file.relative === path.join(component.entries.base, entry)
            );
            if (file) {
              results.push({ title, content: file.contents.toString() });
            }
          });
          return results;
        },
      },
    },
  };
}

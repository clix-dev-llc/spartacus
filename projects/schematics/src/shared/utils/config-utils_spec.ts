import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import path from 'path';
import * as ts from 'typescript';
import { SPARTACUS_CONFIGURATION_FILE_PATH } from '../constants';
import {
  createNewConfig,
  getConfig,
  getExistingStorefrontConfigNode,
  getSpartacusConfigurationFile,
  getSpartacusConfigurationFilePath,
  mergeConfig,
} from './config-utils';
import { commitChanges } from './file-utils';
import { moveConfigToAppModule } from './test-utils';

const collectionPath = path.join(__dirname, '../../collection.json');
const schematicRunner = new SchematicTestRunner('schematics', collectionPath);

describe('Storefront config utils', () => {
  let appTree: UnitTestTree;
  const workspaceOptions: any = {
    name: 'workspace',
    version: '0.5.0',
  };
  const appOptions: any = {
    name: 'schematics-test',
    inlineStyle: false,
    inlineTemplate: false,
    routing: false,
    style: 'scss',
    skipTests: false,
    projectRoot: '',
  };
  const defaultOptions = {
    project: 'schematics-test',
  };
  const appModulePath = '/src/app/app.module.ts';

  beforeEach(async () => {
    appTree = await schematicRunner
      .runExternalSchematicAsync(
        '@schematics/angular',
        'workspace',
        workspaceOptions
      )
      .toPromise();
    appTree = await schematicRunner
      .runExternalSchematicAsync(
        '@schematics/angular',
        'application',
        appOptions,
        appTree
      )
      .toPromise();
    appTree = await schematicRunner
      .runSchematicAsync('add-spartacus', defaultOptions, appTree)
      .toPromise();
  });

  describe('getExistingStorefrontConfigNode', () => {
    it('should get the Storefront config', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;

      expect(config).toBeTruthy();
      expect(config.getFullText()).toContain(`currency: ['USD'],`);
      expect(config.getFullText()).toContain(`resources: translations,`);
      expect(config.getFullText()).toContain(
        `baseUrl: 'https://localhost:9002'`
      );
    });
  });

  describe('getConfig', () => {
    it('should return the specified config from Storefront CallExpression AST node object', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;
      const currentContextConfig = getConfig(config, 'context');

      expect(currentContextConfig).toBeTruthy();
      expect(currentContextConfig?.getFullText()).toContain('currency:');
    });

    it('should return an undefined if the provided configName was not found', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;
      const configByName = getConfig(config, 'test');

      expect(configByName).toBeFalsy();
      expect(configByName).toEqual(undefined);
    });
  });

  describe('mergeConfig', () => {
    it('should merge the provided configs', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;
      const currentContextConfig = getConfig(
        config,
        'context'
      ) as ts.PropertyAssignment;
      const currencyChange = mergeConfig(
        appModulePath,
        currentContextConfig,
        'currency',
        ['EUR', 'JPY']
      );

      expect(appTree.readContent(appModulePath)).not.toContain('EUR');
      expect(appTree.readContent(appModulePath)).not.toContain('JPY');

      commitChanges(appTree, appModulePath, [currencyChange]);

      expect(appTree.readContent(appModulePath)).toContain('EUR');
      expect(appTree.readContent(appModulePath)).toContain('JPY');
    });

    it('should create a new config if nothing to be merge', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;
      const currentContextConfig = getConfig(
        config,
        'context'
      ) as ts.PropertyAssignment;
      const baseSiteChange = mergeConfig(
        appModulePath,
        currentContextConfig,
        'urlParameters',
        ['baseSite', 'language', 'currency']
      );

      expect(appTree.readContent(appModulePath)).not.toContain(
        'urlParameters:'
      );

      commitChanges(appTree, appModulePath, [baseSiteChange]);

      expect(appTree.readContent(appModulePath)).toContain('urlParameters:');
    });
  });

  describe('createNewConfig', () => {
    it('should nest the given new config in the given config object', async () => {
      const { configurationFile } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      const config = getExistingStorefrontConfigNode(
        configurationFile
      ) as ts.ObjectLiteralExpression;
      const currentContextConfig = getConfig(
        config,
        'context'
      ) as ts.PropertyAssignment;
      const testConfigChange = createNewConfig(
        appModulePath,
        currentContextConfig,
        'testObjectConfig',
        ['value1', 'value2']
      );

      expect(appTree.readContent(appModulePath)).not.toContain(
        'testObjectConfig:'
      );

      commitChanges(appTree, appModulePath, [testConfigChange]);

      expect(appTree.readContent(appModulePath)).toContain('testObjectConfig:');
      expect(appTree.readContent(appModulePath)).toContain('value1');
      expect(appTree.readContent(appModulePath)).toContain('value2');
    });
  });

  describe('getSpartacusConfigurationFilePath', () => {
    describe(`when the '${SPARTACUS_CONFIGURATION_FILE_PATH}' exists`, () => {
      it(`should return it as the path, and set 'isAppModule' to false`, async () => {
        const {
          path: resultPath,
          isAppModule,
        } = getSpartacusConfigurationFilePath(appTree, defaultOptions.project);
        expect(resultPath).toEqual(SPARTACUS_CONFIGURATION_FILE_PATH);
        expect(isAppModule).toEqual(false);
      });
    });
    describe(`when the '${SPARTACUS_CONFIGURATION_FILE_PATH}' does NOT exist`, () => {
      beforeEach(() => {
        moveConfigToAppModule(appTree);
      });
      it(`should return app.module.ts as the path, and set 'isAppModule' to true`, async () => {
        const {
          path: resultPath,
          isAppModule,
        } = getSpartacusConfigurationFilePath(appTree, defaultOptions.project);
        expect(resultPath).toEqual(appModulePath);
        expect(isAppModule).toEqual(true);
      });
    });
  });

  describe('getSpartacusConfigurationFile', () => {
    it('should return the source file', async () => {
      const { configurationFile, isAppModule } = getSpartacusConfigurationFile(
        appTree,
        defaultOptions.project
      );
      expect(configurationFile.fileName).toEqual(
        SPARTACUS_CONFIGURATION_FILE_PATH
      );
      expect(isAppModule).toEqual(false);
    });
  });
});

@description('The name of the application')
param appName string = 'evidi-fab-game'

@description('The location for all resources')
param location string = 'westeurope'

@description('The environment name')
param environmentName string = 'dev'

@description('SQL Connection String')
@secure()
param sqlConnectionString string = ''

var appServiceName = '${toLower(appName)}-${toLower(environmentName)}'

// Static Web App (includes Functions support)
resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: appServiceName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    buildProperties: {
      appLocation: '/'
      apiLocation: 'api'
      outputLocation: '/'
    }
  }
}

// Add app settings for the Function App (part of Static Web App)
// Note: App settings are configured after deployment via Azure Portal or CLI
// We'll set them after provisioning completes

// Outputs
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppName string = staticWebApp.name

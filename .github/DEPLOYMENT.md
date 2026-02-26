# Deployment Guide

## GitHub Pages Deployment

This project uses GitHub Actions to automatically deploy to GitHub Pages whenever changes are pushed to the `main` branch.

### Automatic Deployment Process

1. **Code Push**: When code is pushed to `main` branch
2. **Testing**: Validates JavaScript syntax, HTML structure, and runs integration tests
3. **Building**: Minifies HTML, CSS, and JavaScript for optimal performance
4. **Deployment**: Deploys optimized files to GitHub Pages
5. **Monitoring**: Runs Lighthouse CI for performance and accessibility checks

### Manual Deployment

You can trigger deployment manually from the GitHub Actions tab:

1. Go to **Actions** tab in the repository
2. Select **Deploy Monty Hall Simulator to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

### Site URLs

- **Production**: https://johnstetter.github.io/monty-simulator/
- **Repository**: https://github.com/johnstetter/monty-simulator

### Build Optimization

The deployment process includes:

- **HTML Minification**: Removes whitespace and comments
- **CSS Minification**: Compresses stylesheets using CSSO
- **JavaScript Minification**: Compresses JS files using Terser
- **File Size Monitoring**: Tracks asset sizes in build stats

### Performance Standards

The deployment includes automated quality checks:

- **Performance**: Minimum 80% Lighthouse score
- **Accessibility**: Minimum 90% Lighthouse score
- **Best Practices**: Minimum 80% Lighthouse score
- **SEO**: Minimum 80% Lighthouse score

### Troubleshooting Deployment Issues

#### Common Issues

**Deployment fails on testing:**
```bash
# Check JavaScript syntax locally
node --check src/js/*.js

# Run integration tests locally
node test-integration.mjs
```

**Lighthouse CI fails:**
```bash
# The site still deploys, but performance may need improvement
# Check the Actions log for specific Lighthouse recommendations
```

**Build artifacts too large:**
```bash
# Check build-stats.txt in the deployment logs
# Consider optimizing images or removing unnecessary files
```

#### Debug Deployment

1. **Check Actions tab** for detailed error logs
2. **Review build artifacts** to see what was deployed
3. **Test locally** using the same build process:

```bash
# Install build tools
npm install -g html-minifier-terser csso-cli terser

# Create build
mkdir dist
cp -r src dist/
cp index.html dist/

# Minify files (same as CI)
html-minifier-terser --input-dir dist --output-dir dist --file-ext html --collapse-whitespace
find dist -name "*.css" -exec csso {} --output {} \;
find dist -name "*.js" -exec terser {} --compress --mangle --output {} \;

# Test locally
cd dist && python3 -m http.server 8080
```

### Security Considerations

- **No secrets required**: Static site deployment needs no API keys
- **Source code public**: All code is open source and public
- **HTTPS enforced**: GitHub Pages provides automatic HTTPS
- **No server-side code**: Pure client-side application

### Performance Optimization

The build process automatically optimizes:

- **File sizes**: Minification reduces transfer sizes by ~30-50%
- **Load times**: Compressed files load faster
- **Caching**: GitHub Pages provides proper cache headers
- **CDN**: Global content distribution via GitHub's CDN

### Custom Domain Setup (Optional)

To use a custom domain:

1. **Add CNAME file** to repository root:
```bash
echo "monty-hall.yourdomain.com" > CNAME
```

2. **Configure DNS** with your domain provider:
```
Type: CNAME
Name: monty-hall (or @)
Value: johnstetter.github.io
```

3. **Enable in GitHub**: Repository Settings → Pages → Custom domain

### Monitoring and Analytics

**Deployment Monitoring:**
- GitHub Actions provides build status and logs
- Lighthouse CI tracks performance over time
- Build stats show file size trends

**Usage Analytics (Optional):**
```javascript
// Add to index.html if desired (privacy-focused)
// Simple page view counter without user tracking
```

### Environment Variables

No environment variables are required for deployment. All configuration is:

- **Build-time**: Set in GitHub Actions workflow
- **Client-side**: Configured in JavaScript constants
- **Public**: No sensitive data required

### Rollback Procedure

If a deployment breaks the site:

1. **Immediate rollback**: Revert the problematic commit on `main`
2. **Emergency fix**: Push a hotfix directly to `main`
3. **PR rollback**: Create PR to revert changes

```bash
# Example rollback commands
git revert <problematic-commit-hash>
git push origin main
```

The GitHub Actions workflow will automatically redeploy the reverted version.

### Development vs Production

**Development** (local):
- Unminified files for easier debugging
- Full source maps and comments
- Development server with live reload

**Production** (GitHub Pages):
- Minified and compressed files
- Optimized for performance
- Global CDN distribution
- Automated quality checks

---

For questions about deployment, check the Actions logs or create an issue in the repository.
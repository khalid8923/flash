# FLASH - Complete Project Structure

Generated: 2026-10-13 01:25:58
Root: D:\Flash

## Project Overview

- Folders and files are listed recursively.
- Dependency folders, build outputs, caches and generated files are excluded.
- File sizes and modification timestamps are included.
- Existing documentation and source files are preserved.

## Directory Tree

```text
Flash/
  [.github]/
    CODEOWNERS [90 B]
    dependabot.yml [425 B]
    [workflows]/
      ci.yml [1.03 KB]
  .gitignore [516 B]
  AGENTS.md [4.41 KB]
  [backend]/
    .admin-token [47 B]
    .dockerignore [191 B]
    .env [2.13 KB]
    .env.example [1.76 KB]
    .gitignore [619 B]
    [backups]/
      flash-backup-2026-10-08T21-17-36.json.enc [264.12 KB]
    [deploy]/
      README.md [2.89 KB]
    diag.mjs [988 B]
    Dockerfile [1002 B]
    install-bonus.ps1 [0 B]
    package.json [1.06 KB]
    package-lock.json [53.46 KB]
    render.yaml [1.48 KB]
    [scripts]/
      audit-db.ts [8.31 KB]
      backup-db.ts [3.78 KB]
      golden-tests.ts [5.05 KB]
      setup-owner.ts [1.56 KB]
      verify-catalog.ts [535 B]
      verify-db.ts [971 B]
      verify-seed.ts [772 B]
    SECURITY.md [1.48 KB]
    [src]/
      [catalog]/
        _meta.ts [15.57 KB]
        _migrate.ts [7.30 KB]
        [games]/
          alternative-uses.ts [4.51 KB]
          argument-analyzer.ts [4.61 KB]
          block-counter.ts [4.35 KB]
          color-match.ts [4.82 KB]
          corsi-blocks.ts [4.30 KB]
          creative-connect.ts [4.83 KB]
          deduction.ts [4.49 KB]
          digit-span.ts [3.06 KB]
          empathy-engine.ts [4.56 KB]
          face-match.ts [4.44 KB]
          flanker.ts [4.80 KB]
          flash-cards.ts [3.06 KB]
          gear-logic.ts [4.19 KB]
          go-no-go.ts [4.56 KB]
          hanoi.ts [4.10 KB]
          idea-flow.ts [4.51 KB]
          lexical-decision.ts [4.81 KB]
          map-memory.ts [4.29 KB]
          matrix-logic.ts [4.64 KB]
          mental-math.ts [3.13 KB]
          mental-rotation.ts [4.44 KB]
          micro-expressions.ts [4.59 KB]
          n-back.ts [4.58 KB]
          num-chains.ts [3.10 KB]
          path-finder.ts [4.43 KB]
          pattern-recall.ts [4.62 KB]
          rapid-fire.ts [4.54 KB]
          reaction.ts [4.34 KB]
          river-crossing.ts [4.62 KB]
          seq-mem.ts [4.54 KB]
          social-read.ts [4.48 KB]
          speed-calc.ts [3.10 KB]
          story-spark.ts [4.39 KB]
          syllogisms.ts [4.51 KB]
          symbol-sprint.ts [4.54 KB]
          task-switching.ts [4.62 KB]
          tone-detector.ts [4.53 KB]
          truth-tbl.ts [3.11 KB]
          verbal-analogies.ts [5.03 KB]
          vigilance.ts [4.58 KB]
          vocabulary-elite.ts [4.89 KB]
          word-scramble.ts [4.46 KB]
        index.ts [450 B]
        registry.ts [8.17 KB]
        types.ts [3.68 KB]
      [config]/
        db.ts [1.08 KB]
        env.ts [1.64 KB]
        rate-limit.ts [1.49 KB]
      [lib]/
        error-handler.ts [3.38 KB]
        errors.ts [6.31 KB]
      [middleware]/
        admin-auth.ts [2.08 KB]
        auth.ts [2.05 KB]
        idempotency.ts [2.21 KB]
        step-up.ts [1.66 KB]
      migrate.ts [3.37 KB]
      [migrations]/
        001_identity.sql [664 B]
        002_catalog.sql [1.74 KB]
        003_facts.sql [1.71 KB]
        004_derived.sql [2.87 KB]
        005_ai.sql [1.64 KB]
        006_difficulty.sql [1.99 KB]
        007_ai_coach.sql [886 B]
        008_ai_extended.sql [6.12 KB]
        009_predictions_enhanced.sql [1.50 KB]
        010_soft_delete_and_indexes.sql [1.67 KB]
        011_games_defaults.sql [1.56 KB]
        012_migration_checksums.sql [264 B]
        013_admin_bootstrap.sql [2.08 KB]
        014_player_auth.sql [2.17 KB]
        015_tickets_v2.sql [953 B]
        016_fix_play_tickets.sql [610 B]
        017_session_reviews.sql [783 B]
        018_norms_pipeline.sql [536 B]
        019_metric_daily.sql [465 B]
        020_feature_flags.sql [1.04 KB]
        021_ai_usage.sql [877 B]
        022_job_runs.sql [911 B]
        023_privacy_requests.sql [773 B]
      [routes]/
        admin-ai.ts [2.11 KB]
        admin-analytics.ts [1.84 KB]
        admin-auth.ts [6.39 KB]
        admin-catalog.ts [3.75 KB]
        admin-console.ts [2.89 KB]
        admin-demo.ts [4.24 KB]
        admin-demo-scripts.ts [2.04 KB]
        admin-difficulty.ts [5.17 KB]
        admin-flags.ts [2.59 KB]
        admin-integrity.ts [4.91 KB]
        admin-jobs.ts [1.85 KB]
        admin-norms.ts [2.84 KB]
        admin-platform.ts [3.64 KB]
        admin-privacy.ts [1.38 KB]
        admin-registry.ts [2.62 KB]
        admin-retention.ts [2.08 KB]
        ai.ts [6.68 KB]
        ai-coach.ts [2.44 KB]
        ai-director.ts [9.78 KB]
        ai-journal.ts [4.19 KB]
        ai-predictions.ts [2.19 KB]
        ai-profile.ts [10.55 KB]
        ai-variants.ts [4.02 KB]
        ai-voice.ts [3.70 KB]
        auth.ts [3.17 KB]
        games.ts [2.45 KB]
        health.ts [1.62 KB]
        health.ts.pre-step1.5 [487 B]
        me.ts [1.67 KB]
        next.ts [2.47 KB]
        plan.ts [648 B]
        plays.ts [3.16 KB]
        profile.ts [1.87 KB]
        profile-snapshot.ts [1.33 KB]
        sessions.ts [7.01 KB]
        sessions.ts.bak-pre-error-sys [7.01 KB]
        sessions.ts.pre-r03c [6.23 KB]
        sessions.ts.pre-r05 [5.16 KB]
        sessions.ts.pre-s12fix [7.07 KB]
        sync.ts [3.75 KB]
      [schemas]/
        session.ts [1.21 KB]
      [scripts]/
        sync-catalog.ts [1.29 KB]
      seed.ts [12.90 KB]
      seed-atlas.ts [1.33 KB]
      server.ts [6.71 KB]
      server.ts.pre-r11 [3.56 KB]
      [services]/
        admin-auth.ts [3.32 KB]
        [ai]/
          coach.ts [5.91 KB]
          context.ts [6.57 KB]
          daily-plan.ts [16.26 KB]
          [director]/
            decider.ts [22.00 KB]
            prompts.ts [12.23 KB]
            session.ts [3.43 KB]
            types.ts [3.89 KB]
          error-patterns.ts [15.74 KB]
          fallback-policy.ts [4.59 KB]
          fingerprint.ts [15.82 KB]
          gemini-client.ts [3.67 KB]
          generate.ts [6.25 KB]
          groq-client.ts [2.80 KB]
          health.ts [1.79 KB]
          insights.ts [11.07 KB]
          journal.ts [13.04 KB]
          lab.ts [14.92 KB]
          micro-lessons.ts [15.07 KB]
          nudge.ts [5.33 KB]
          predictions.ts [22.67 KB]
          prompts.ts [1.22 KB]
          prompts-base.ts [6.20 KB]
          prompts-daily-plan.ts [6.46 KB]
          prompts-error-patterns.ts [3.95 KB]
          prompts-extended.ts [19.35 KB]
          prompts-fingerprint.ts [5.95 KB]
          prompts-insights.ts [5.47 KB]
          prompts-journal.ts [6.54 KB]
          prompts-lab.ts [8.10 KB]
          prompts-micro-lessons.ts [6.34 KB]
          prompts-nudge.ts [3.47 KB]
          prompts-predictions.ts [7.33 KB]
          prompts-recap.ts [4.64 KB]
          prompts-transfer-tracker.ts [4.96 KB]
          [providers]/
            gemini-provider.ts [3.51 KB]
            groq-provider.ts [1.13 KB]
            openrouter-provider.ts [2.86 KB]
            types.ts [1.04 KB]
          recap.ts [5.45 KB]
          router.ts [4.76 KB]
          transfer-tracker.ts [14.53 KB]
          validator.ts [6.96 KB]
          [variants]/
            prompts.ts [10.76 KB]
            types.ts [5.82 KB]
            validators.ts [6.60 KB]
            variants.ts [15.85 KB]
          [voice]/
            transcribe.ts [2.81 KB]
            voice-coach.ts [3.12 KB]
        ai-content-pool.ts [2.55 KB]
        ai-usage.ts [5.09 KB]
        analytics.ts [4.87 KB]
        auth.ts [6.72 KB]
        badges.ts [1.68 KB]
        cache.ts [2.02 KB]
        catalog-sync.ts [6.63 KB]
        claims-lexicon.ts [2.77 KB]
        demo-scripts.ts [3.03 KB]
        derive.ts [2.57 KB]
        [difficulty]/
          atlas.ts [19.07 KB]
          engine.ts [7.15 KB]
        feature-flags.ts [3.29 KB]
        ingestion-validator.ts [3.67 KB]
        integrity-rules.ts [2.83 KB]
        integrity-rules.ts.bak-pre-error-sys [2.83 KB]
        job-runner.ts [4.66 KB]
        norms.ts [5.67 KB]
        pb.ts [1.98 KB]
        planner.ts [8.51 KB]
        privacy.ts [7.26 KB]
        privacy-player.ts [6.02 KB]
        [profile]/
          snapshot.ts [24.88 KB]
          types.ts [2.44 KB]
        recommendations.ts [6.79 KB]
        retention.ts [3.07 KB]
        sanitize.ts [2.32 KB]
        stats.ts [7.34 KB]
        tickets.ts [4.04 KB]
        trial-stats.ts [2.89 KB]
        user-lock.ts [1.15 KB]
        users.ts [859 B]
    [test]/
    test.ps1 [5.98 KB]
      [fixtures]/
    test-catalog.ps1 [4.06 KB]
    test-health.ps1 [2.56 KB]
    test-r05.mjs [2.31 KB]
    test-rate-limit.ps1 [3.90 KB]
    test-security.ps1 [2.28 KB]
    tsconfig.json [587 B]
    verify.ps1 [2.71 KB]
  create-game.bat [1.50 KB]
  [design-v4]/
    flash.css [7.27 KB]
    FLASH.html [863 B]
    flash-cortex-reef.html [31.25 KB]
    flash-main-dashboard.html [41.73 KB]
    flash-main-dashboard-NEW.html [41.49 KB]
    [js]/
      flash-core.js [9.38 KB]
      flash-data.js [5.73 KB]
  [docs]/
    00_INDEX.md [3.89 KB]
    [01_ARCHITECTURE]/
      01_CORE_ARCHITECTURE.md [5.13 KB]
      02_STRATEGY_AND_ARCHITECTURE.md [15.35 KB]
      03_SYSTEM_ARCHITECTURE.md [5.76 KB]
    [02_CONTRACTS]/
      01_SESSION_SCHEMA.md [7.84 KB]
      02_TRIAL_SCHEMA.md [11.16 KB]
      03_POSTMESSAGE_PROTOCOL.md [10.42 KB]
      04_GAME_CATALOG.md [7.94 KB]
    [03_BACKEND]/
      01_FOUNDATION.md [1.87 KB]
      02_HANDOFF_v1.md [18.98 KB]
      03_HANDOFF_v2.md [25.87 KB]
      04_HANDOFF_v3.md [6.60 KB]
      05_HANDOFF_v4.md [9.54 KB]
      06_HANDOFF_v4.1.md [20.21 KB]
      07_FIX_LOG.md [8.48 KB]
    [04_AI_SYSTEM]/
      01_PLAYER_INTELLIGENCE.md [16.12 KB]
      02_ADAPTIVE_ENGINE.md [13.86 KB]
      03_AI_CONTRACTS.md [37.95 KB]
    [05_FRONTEND]/
      01_ROADMAP_AND_STATUS.md [5.06 KB]
      02_WORKFLOW_AND_RULES.md [4.25 KB]
    [06_PROJECT_HISTORY]/
      01_OVERVIEW.md [4.38 KB]
      02_HISTORY.md [5.84 KB]
      03_EVOLUTION.md [5.95 KB]
      04_LEGACY_REFERENCE.md [51.74 KB]
      05_LEGACY_INDEX.md [2.81 KB]
    [07_SESSIONS]/
      01_RECENT_SESSION.md [8.80 KB]
      02_SESSION_LOG_v1.md [21.26 KB]
    [08_STATS_AND_TREES]/
      01_STATS.md [2.28 KB]
      02_TREE.md [21.31 KB]
      03_TREE_FULL.md [20.13 KB]
      04_TREE_RAW.txt [28.02 KB]
      05_TREE_SIMPLE.txt [173.24 KB]
      06_FOLDERS.txt [3.52 KB]
      07_PATHS.txt [28.25 KB]
      08_TOTAL_REFERENCE.md [47.04 KB]
    BACKEND_HANDOFF_v4.1.md [0 B]
    DOCS_TREE.txt [4.15 KB]
    FLASH_PROJECT_MEMORY_EXPORT_2026-10-13.txt [73.93 KB]
    FULL_BUILD_LOG.md [19.59 KB]
  favicon.ico [71 B]
  FLASH_DIAGNOSTIC_2026-10-12_12-01.txt [10.04 KB]
  [frontend]/
    [assets]/
    [css]/
      [components]/
      [core]/
      [games]/
    [dashboard]/
      [_legacy]/
        flash.css [30.90 KB]
        FLASH.html [28.16 KB]
        FLASH-old.html [5.86 KB]
        js__flash-charts.js [6.18 KB]
        js__flash-core.js [13.28 KB]
        js__flash-data.js [28.85 KB]
        js__flash-data.js.backup [25.49 KB]
      404.html [1.79 KB]
      ai-lab.html [1.49 KB]
      [assets]/
        icon-192.svg [1019 B]
        icon-512.svg [1.01 KB]
      auth.html [5.94 KB]
      [css]/
        base.css [1.71 KB]
        layout.css [6.86 KB]
        layout.css.bak-fullwidth [5.50 KB]
        [modules]/
          a11y.css [1.31 KB]
          ai-chat.css [10.42 KB]
          ai-lab.css [3.45 KB]
          ai-panels-live.css [1.58 KB]
          ambient.css [2.07 KB]
          ambient-pack-v2.css [5.97 KB]
          auth.css [12.41 KB]
          auth-guard.css [2.98 KB]
          brain.css [1.05 KB]
          brain-alt.css [2.51 KB]
          brain-v3.css [1.31 KB]
          brain-v3-force.css [609 B]
          chat-extras.css [3.69 KB]
          cheat-sheet.css [2.25 KB]
          command-palette.css [3.48 KB]
          daily-plan.css [2.10 KB]
          data-io.css [638 B]
          director.css [2.40 KB]
          domain-compare.css [3.34 KB]
          domain-games.css [2.66 KB]
          error-page.css [6.89 KB]
          error-ui.css [12.96 KB]
          export-snapshot.css [1.49 KB]
          fingerprint.css [4.48 KB]
          focus-mode.css [2.41 KB]
          full-width.css [2.41 KB]
          grid-fix.css [996 B]
          interactions.css [2.79 KB]
          layout-override.css [1.73 KB]
          live-status.css [2.95 KB]
          micro-lessons.css [1.36 KB]
          milestone.css [1.67 KB]
          mobile.css [2.82 KB]
          navigation.css [2.09 KB]
          nudge.css [1.04 KB]
          onboarding.css [2.52 KB]
          print.css [2.13 KB]
          provider-status.css [1.34 KB]
          pwa.css [2.06 KB]
          rtl-polish.css [1.97 KB]
          session-detail.css [2.88 KB]
          session-hud.css [2.17 KB]
          session-progress.css [1.98 KB]
          session-recap.css [2.43 KB]
          settings-panel.css [4.52 KB]
          single-view.css [2.83 KB]
          split-pane.css [4.23 KB]
          streak-break.css [2.33 KB]
          streak-ring.css [1.30 KB]
          theme-transition.css [769 B]
          variants.css [1.01 KB]
          week-heatmap.css [2.01 KB]
          wide-panels.css [5.01 KB]
          xp-gain.css [1.08 KB]
        [panels]/
          recent.css [1.15 KB]
          season.css [2.83 KB]
          today.css [1.73 KB]
        tokens.css [2.72 KB]
      domain.html [17.30 KB]
      domain.html.bak-flashfix [17.30 KB]
      domain.html.bak-pre-backfix [17.30 KB]
      error.html [9.29 KB]
      errors-demo.html [6.81 KB]
      favicon.ico [71 B]
      favicon.svg [243 B]
      fingerprint.html [1.63 KB]
      FLASH.html [1.32 KB]
      index.html [8.16 KB]
      index.html.bak-014604 [6.87 KB]
      index.html.bak-aichat [8.33 KB]
      index.html.bak-aipanels [7.10 KB]
      index.html.bak-brain [8.27 KB]
      index.html.bak-cachefix [9.13 KB]
      index.html.bak-final [6.87 KB]
      index.html.bak-final-features [7.80 KB]
      index.html.bak-fullfix [8.43 KB]
      index.html.bak-nuke [7.54 KB]
      index.html.bak-nuke2 [7.08 KB]
      index.html.bak-phase23 [7.22 KB]
      index.html.bak-pre-reorder [7.60 KB]
      index.html.bak-pre-script-fix [7.60 KB]
      index.html.bak-real [6.87 KB]
      index.html.bak-real-final [7.08 KB]
      index.html.bak-recap [7.54 KB]
      [js]/
        api.js [6.66 KB]
        api.js.bak-pre-error-sys [4.68 KB]
        api.js.bak-pre-error-system [4.42 KB]
        config.js [1.13 KB]
        core.js [2.63 KB]
        data.js [14.56 KB]
        domain-brain.js [6.33 KB]
        i18n.js [1.75 KB]
        inline-init.js [2.77 KB]
        [lib]/
          errors.js [6.27 KB]
          safe-fetch.js [4.07 KB]
        [modules]/
          a11y.js [2.41 KB]
          achievement-guard.js [5.21 KB]
          ai-chat.js [14.70 KB]
          ai-lab.js [4.47 KB]
          ai-panels-live.js [8.31 KB]
          ambient.js [3.55 KB]
          ambient-pack-v2.js [6.38 KB]
          audio-unlock.js [1.17 KB]
          auth.js [21.23 KB]
          auth-guard.js [10.97 KB]
          brain.js [10.00 KB]
          brain-alt.js [19.01 KB]
          brain-alt-panel.js [2.89 KB]
          brain-state.js [2.62 KB]
          brain-v3.js [16.86 KB]
          chat-extras.js [10.36 KB]
          cheat-sheet.js [4.86 KB]
          command-palette.js [9.56 KB]
          component-boundaries.js [2.66 KB]
          daily-plan.js [4.79 KB]
          data-io.js [3.39 KB]
          director.js [4.79 KB]
          domain-back.js [2.00 KB]
          domain-compare.js [4.97 KB]
          domain-games.js [3.55 KB]
          error-ui.js [12.69 KB]
          export-snapshot.js [4.29 KB]
          fingerprint.js [5.01 KB]
          focus-mode.js [2.61 KB]
          game-catalog-patch.js [4.33 KB]
          game-complete-bridge.js [6.85 KB]
          lang-flip.js [3.17 KB]
          live-data.js [5.78 KB]
          live-status.js [3.32 KB]
          live-status.js.bak-pre-guard [3.24 KB]
          micro-lessons.js [3.57 KB]
          milestone.js [1.16 KB]
          mobile-nav.js [3.46 KB]
          multi-tab-sync.js [3.81 KB]
          navigation.js [3.46 KB]
          network-monitor.js [3.34 KB]
          neural-network-panel.js [2.48 KB]
          nudge.js [3.15 KB]
          onboarding.js [4.09 KB]
          provider-status.js [2.50 KB]
          pwa.js [156 B]
          pwa.js.disabled-by-fix [2.98 KB]
          recent.js [1.93 KB]
          recent.js.bak-final [2.57 KB]
          recent.js.bak-v2 [1.99 KB]
          reminder.js [2.91 KB]
          save-pill.js [2.07 KB]
          save-queue.js [6.42 KB]
          season.js [2.92 KB]
          session-detail.js [4.77 KB]
          session-hud.js [2.91 KB]
          session-progress.js [3.16 KB]
          session-recap.js [5.09 KB]
          session-restore.js [3.66 KB]
          settings-panel.js [10.89 KB]
          sound.js [4.14 KB]
          split-pane.js [6.53 KB]
          streak-break.js [3.20 KB]
          streak-ring.js [2.27 KB]
          tag-panels.js [2.20 KB]
          theme-transition.js [2.92 KB]
          timer-guard.js [6.63 KB]
          today.js [2.50 KB]
          variants.js [2.88 KB]
          week-heatmap.js [2.75 KB]
          wide-panels.js [13.63 KB]
          xp-gain.js [4.54 KB]
        render.js [2.61 KB]
        sw-cleanup.js [390 B]
        sw-killer.js [743 B]
        toast-dedupe.js [843 B]
      manifest.webmanifest [1.01 KB]
      sessions.html [11.81 KB]
      stats.ps1 [3.55 KB]
    [games]/
      [_template]/
      [attention]/
        [flanker]/
          config.json [653 B]
          flanker-extra-modes.js [22.00 KB]
          flanker-helpers.js [14.21 KB]
          flanker-sounds.js [3.31 KB]
          flanker-stages.js [2.21 KB]
          flanker-tutorial.js [9.04 KB]
          game.css [31.43 KB]
          game.html [3.37 KB]
          game.js [68.48 KB]
          [templates]/
        [go-no-go]/
        [go-no-go.legacy]/
          config.json [290 B]
          game.css [29.53 KB]
          game.html [1.91 KB]
          game.js [49.18 KB]
          gng-analytics.js [7.77 KB]
          gng-ddm.js [6.42 KB]
          gng-helpers.js [14.03 KB]
          gng-modes.js [21.63 KB]
          gng-sounds.js [4.65 KB]
          gng-stages.js [2.11 KB]
          config.json [869 B]
          game.css [6.07 KB]
          game.html [1.88 KB]
          game.js [11.57 KB]
          go-no-go-extra-modes.js [1.27 KB]
          go-no-go-helpers.js [8.76 KB]
          go-no-go-sounds.js [1.29 KB]
          go-no-go-stages.js [1.59 KB]
        [task-switching]/
          config.json [297 B]
          game.css [28.29 KB]
          game.html [3.45 KB]
          game.js [36.86 KB]
          task-switching-extra-modes.js [27.85 KB]
          task-switching-helpers.js [12.69 KB]
          task-switching-sounds.js [3.97 KB]
          task-switching-stages.js [2.13 KB]
        [vigilance]/
          config.json [670 B]
          game.css [25.03 KB]
          game.html [2.14 KB]
          game.js [31.49 KB]
          vigilance-extra-modes.js [20.14 KB]
          vigilance-helpers.js [13.05 KB]
          vigilance-sounds.js [3.79 KB]
          vigilance-stages.js [2.10 KB]
      [creativity]/
        [alternative-uses]/
          alternative-uses-extra-modes.js [18.75 KB]
          alternative-uses-helpers.js [12.58 KB]
          alternative-uses-sounds.js [3.65 KB]
          alternative-uses-stages.js [2.11 KB]
          config.json [306 B]
          game.css [28.77 KB]
          game.html [3.31 KB]
          game.js [39.28 KB]
        [creative-connect]/
          config.json [312 B]
          creative-connect-extra-modes.js [18.85 KB]
          creative-connect-helpers.js [12.56 KB]
          creative-connect-sounds.js [3.97 KB]
          creative-connect-stages.js [2.13 KB]
          game.css [28.87 KB]
          game.html [3.39 KB]
          game.js [46.73 KB]
        [idea-flow]/
          config.json [292 B]
          game.css [24.80 KB]
          game.html [2.14 KB]
          game.js [31.92 KB]
          idea-flow-extra-modes.js [5.58 KB]
          idea-flow-helpers.js [7.08 KB]
          idea-flow-sounds.js [2.89 KB]
          idea-flow-stages.js [1.74 KB]
        [story-spark]/
          config.json [285 B]
          game.css [23.96 KB]
          game.html [2.15 KB]
          game.js [32.90 KB]
          story-spark-extra-modes.js [16.49 KB]
          story-spark-helpers.js [12.60 KB]
          story-spark-sounds.js [3.95 KB]
          story-spark-stages.js [2.12 KB]
      [emotional]/
        [empathy-engine]/
          config.json [305 B]
          empathy-engine-extra-modes.js [16.05 KB]
          empathy-engine-helpers.js [12.07 KB]
          empathy-engine-sounds.js [3.89 KB]
          empathy-engine-stages.js [2.11 KB]
          game.css [25.30 KB]
          game.html [2.17 KB]
          game.js [38.25 KB]
        [micro-expressions]/
          config.json [301 B]
          game.css [24.02 KB]
          game.html [2.18 KB]
          game.js [34.83 KB]
          micro-expressions-extra-modes.js [20.36 KB]
          micro-expressions-helpers.js [12.16 KB]
          micro-expressions-sounds.js [3.96 KB]
          micro-expressions-stages.js [2.13 KB]
        [social-read]/
          config.json [293 B]
          game.css [25.35 KB]
          game.html [2.15 KB]
          game.js [42.39 KB]
          social-read-extra-modes.js [15.98 KB]
          social-read-helpers.js [12.21 KB]
          social-read-sounds.js [3.88 KB]
          social-read-stages.js [2.12 KB]
        [tone-detector]/
          config.json [298 B]
          game.css [25.68 KB]
          game.html [2.16 KB]
          game.js [36.93 KB]
          tone-detector-extra-modes.js [16.19 KB]
          tone-detector-helpers.js [12.13 KB]
          tone-detector-sounds.js [3.84 KB]
          tone-detector-stages.js [2.12 KB]
      [language]/
        [lexical-decision]/
          config.json [292 B]
          game.css [25.72 KB]
          game.html [2.18 KB]
          game.js [38.06 KB]
          lexical-decision-extra-modes.js [18.92 KB]
          lexical-decision-helpers.js [13.37 KB]
          lexical-decision-sounds.js [4.06 KB]
          lexical-decision-stages.js [2.17 KB]
        [verbal-analogies]/
          config.json [1.01 KB]
          game.css [26.78 KB]
          game.html [2.20 KB]
          game.js [43.04 KB]
          verbal-analogies-extra-modes.js [20.63 KB]
          verbal-analogies-helpers.js [12.44 KB]
          verbal-analogies-sounds.js [4.45 KB]
          verbal-analogies-stages.js [2.14 KB]
        [vocabulary-elite]/
          config.json [784 B]
          game.css [25.49 KB]
          game.html [2.20 KB]
          game.js [35.74 KB]
          vocabulary-elite-extra-modes.js [20.13 KB]
          vocabulary-elite-helpers.js [12.40 KB]
          vocabulary-elite-sounds.js [4.45 KB]
          vocabulary-elite-stages.js [2.13 KB]
        [word-scramble]/
          config.json [847 B]
          game.css [26.94 KB]
          game.html [2.18 KB]
          game.js [44.73 KB]
          word-scramble-extra-modes.js [24.34 KB]
          word-scramble-helpers.js [12.61 KB]
          word-scramble-sounds.js [4.87 KB]
          word-scramble-stages.js [2.11 KB]
      [logic]/
        [argument-analyzer]/
          argument-analyzer-extra-modes.js [19.44 KB]
          argument-analyzer-helpers.js [12.46 KB]
          argument-analyzer-sounds.js [4.39 KB]
          argument-analyzer-stages.js [2.08 KB]
          config.json [869 B]
          game.css [25.15 KB]
          game.html [2.20 KB]
          game.js [42.43 KB]
        [deduction]/
          config.json [612 B]
          deduction-extra-modes.js [17.52 KB]
          deduction-helpers.js [11.16 KB]
          deduction-sounds.js [3.98 KB]
          deduction-stages.js [2.13 KB]
          game.css [25.94 KB]
          game.html [2.15 KB]
          game.js [37.15 KB]
        [matrix-logic]/
          config.json [649 B]
          game.css [25.13 KB]
          game.html [2.16 KB]
          game.js [38.02 KB]
          matrix-logic-extra-modes.js [17.76 KB]
          matrix-logic-helpers.js [12.24 KB]
          matrix-logic-sounds.js [3.84 KB]
          matrix-logic-stages.js [2.12 KB]
        [syllogisms]/
          config.json [647 B]
          game.css [27.60 KB]
          game.html [2.15 KB]
          game.js [37.13 KB]
          syllogisms-extra-modes.js [18.01 KB]
          syllogisms-helpers.js [12.23 KB]
          syllogisms-sounds.js [4.07 KB]
          syllogisms-stages.js [2.11 KB]
        [truth-tbl]/
          config.json [281 B]
          game.css [17.27 KB]
          game.html [1.86 KB]
          game.js [14.22 KB]
          truth-tbl-extra-modes.js [1.67 KB]
          truth-tbl-helpers.js [8.08 KB]
          truth-tbl-sounds.js [1.48 KB]
          truth-tbl-stages.js [1.66 KB]
      [memory]/
        [face-match]/
          config.json [627 B]
          face-match-extra-modes.js [16.20 KB]
          face-match-helpers.js [11.50 KB]
          face-match-sounds.js [4.02 KB]
          face-match-stages.js [2.12 KB]
          game.css [26.15 KB]
          game.html [2.15 KB]
          game.js [38.37 KB]
        [flash-cards]/
          config.json [251 B]
          flash-cards-extra-modes.js [1.81 KB]
          flash-cards-helpers.js [8.03 KB]
          flash-cards-sounds.js [1.48 KB]
          flash-cards-stages.js [1.65 KB]
          game.css [9.11 KB]
          game.html [1.86 KB]
          game.js [13.08 KB]
        [n-back]/
          config.json [647 B]
          game.css [25.82 KB]
          game.html [2.13 KB]
          game.js [32.49 KB]
          n-back-extra-modes.js [18.75 KB]
          n-back-helpers.js [13.21 KB]
          n-back-sounds.js [3.90 KB]
          n-back-stages.js [2.12 KB]
        [pattern-recall]/
          config.json [613 B]
          game.css [22.40 KB]
          game.html [2.17 KB]
          game.js [29.28 KB]
          pattern-recall-extra-modes.js [15.96 KB]
          pattern-recall-helpers.js [11.56 KB]
          pattern-recall-sounds.js [3.99 KB]
          pattern-recall-stages.js [2.14 KB]
        [seq-mem]/
          config.json [650 B]
          game.css [25.37 KB]
          game.html [2.15 KB]
          game.js [30.97 KB]
          seq-mem-extra-modes.js [21.07 KB]
          seq-mem-helpers.js [12.47 KB]
          seq-mem-sounds.js [4.39 KB]
          seq-mem-stages.js [2.10 KB]
      [numerical]/
        [digit-span]/
          config.json [283 B]
          digit-span-extra-modes.js [1.74 KB]
          digit-span-helpers.js [7.99 KB]
          digit-span-sounds.js [1.67 KB]
          digit-span-stages.js [1.62 KB]
          game.css [15.56 KB]
          game.html [1.85 KB]
          game.js [17.06 KB]
        [mental-math]/
          config.json [279 B]
          game.css [10.38 KB]
          game.html [1.47 KB]
          game.js [22.72 KB]
          mental-math-extra-modes.js [10.32 KB]
          mental-math-helpers.js [8.94 KB]
          mental-math-sounds.js [3.32 KB]
          mental-math-stages.js [2.04 KB]
        [num-chains]/
          config.json [291 B]
          game.css [11.87 KB]
          game.html [1.47 KB]
          game.js [27.58 KB]
          num-chains-extra-modes.js [6.05 KB]
          num-chains-helpers.js [7.51 KB]
          num-chains-sounds.js [2.69 KB]
          num-chains-stages.js [1.79 KB]
        [speed-calc]/
          config.json [288 B]
          game.css [12.62 KB]
          game.html [1.70 KB]
          game.js [21.73 KB]
          speed-calc-extra-modes.js [6.01 KB]
          speed-calc-helpers.js [7.15 KB]
          speed-calc-sounds.js [2.69 KB]
          speed-calc-stages.js [1.83 KB]
      [problem]/
        [gear-logic]/
          config.json [614 B]
          game.css [24.98 KB]
          game.html [2.15 KB]
          game.js [33.95 KB]
          gear-logic-extra-modes.js [17.56 KB]
          gear-logic-helpers.js [11.85 KB]
          gear-logic-sounds.js [3.99 KB]
          gear-logic-stages.js [2.12 KB]
        [hanoi]/
          config.json [615 B]
          game.css [26.03 KB]
          game.html [2.13 KB]
          game.js [30.69 KB]
          hanoi-extra-modes.js [23.46 KB]
          hanoi-helpers.js [12.05 KB]
          hanoi-sounds.js [4.11 KB]
          hanoi-stages.js [2.12 KB]
        [path-finder]/
          config.json [640 B]
          game.css [24.65 KB]
          game.html [2.15 KB]
          game.js [32.11 KB]
          path-finder-extra-modes.js [16.91 KB]
          path-finder-helpers.js [11.69 KB]
          path-finder-sounds.js [4.15 KB]
          path-finder-stages.js [2.11 KB]
        [river-crossing]/
          config.json [635 B]
          game.css [27.05 KB]
          game.html [2.17 KB]
          game.js [33.15 KB]
          river-crossing-extra-modes.js [19.36 KB]
          river-crossing-helpers.js [12.06 KB]
          river-crossing-sounds.js [4.13 KB]
          river-crossing-stages.js [2.13 KB]
      [spatial]/
        [block-counter]/
          block-counter-extra-modes.js [17.58 KB]
          block-counter-helpers.js [11.74 KB]
          block-counter-sounds.js [4.04 KB]
          block-counter-stages.js [2.11 KB]
          config.json [644 B]
          game.css [24.81 KB]
          game.html [2.16 KB]
          game.js [35.59 KB]
        [corsi-blocks]/
          config.json [630 B]
          corsi-blocks-extra-modes.js [17.29 KB]
          corsi-blocks-helpers.js [11.56 KB]
          corsi-blocks-sounds.js [3.97 KB]
          corsi-blocks-stages.js [2.10 KB]
          game.css [24.55 KB]
          game.html [2.16 KB]
          game.js [29.40 KB]
        [map-memory]/
          config.json [655 B]
          game.css [25.76 KB]
          game.html [2.15 KB]
          game.js [31.93 KB]
          map-memory-extra-modes.js [18.73 KB]
          map-memory-helpers.js [11.69 KB]
          map-memory-sounds.js [4.00 KB]
          map-memory-stages.js [2.12 KB]
        [mental-rotation]/
          config.json [687 B]
          game.css [25.17 KB]
          game.html [2.17 KB]
          game.js [35.75 KB]
          mental-rotation-extra-modes.js [17.74 KB]
          mental-rotation-helpers.js [12.85 KB]
          mental-rotation-sounds.js [3.85 KB]
          mental-rotation-stages.js [2.13 KB]
      [speed]/
        [color-match]/
          color-match-extra-modes.js [16.82 KB]
          color-match-helpers.js [13.34 KB]
          color-match-sounds.js [4.24 KB]
          color-match-stages.js [2.26 KB]
          config.json [386 B]
          game.css [25.82 KB]
          game.html [2.15 KB]
          game.js [35.64 KB]
        [rapid-fire]/
          config.json [361 B]
          game.css [26.51 KB]
          game.html [2.15 KB]
          game.js [39.84 KB]
          rapid-fire-extra-modes.js [17.00 KB]
          rapid-fire-helpers.js [13.25 KB]
          rapid-fire-sounds.js [4.15 KB]
          rapid-fire-stages.js [2.17 KB]
        [reaction]/
          config.json [300 B]
          game.css [26.00 KB]
          game.html [2.14 KB]
          game.js [27.32 KB]
          reaction-extra-modes.js [18.02 KB]
          reaction-helpers.js [13.00 KB]
          reaction-sounds.js [4.34 KB]
          reaction-stages.js [2.23 KB]
        [symbol-sprint]/
          config.json [377 B]
          game.css [24.60 KB]
          game.html [2.16 KB]
          game.js [35.52 KB]
          symbol-sprint-extra-modes.js [17.78 KB]
          symbol-sprint-helpers.js [13.42 KB]
          symbol-sprint-sounds.js [4.17 KB]
          symbol-sprint-stages.js [2.26 KB]
      [vigilance]/
      [word-scramble]/
    [js]/
      [core]/
      [dashboard]/
      [games]/
    [shared]/
      flash-stages.js [6.17 KB]
      i18n.js [15.50 KB]
      settings.js [14.74 KB]
      [templates]/
        create-game.bat [1.50 KB]
        extra-modes.template.js [17.12 KB]
        game.template.html [3.39 KB]
        game.template.js [25.14 KB]
        helpers.template.js [9.81 KB]
        README.md [4.15 KB]
        stages.template.js [2.31 KB]
  [motion-lab]/
    dashboard.html [28.38 KB]
    login.html [22.11 KB]
    logo.html [15.59 KB]
    [shared]/
      logo.js [13.52 KB]
  PROJECT_SCAN_2026-10-12_23-09.txt [7.52 KB]
  PROJECT_TREE.ps1 [3.16 KB]
  PROJECT_TREE_COMPLETE.md [51.79 KB]
  stats.ps1 [5.38 KB]
  verify-error-system.ps1 [3.75 KB]
  verify-games.ps1 [2.70 KB]
```

## File Inventory

| Relative Path | Type | Size | Last Modified |
|---|---|---:|---|
| .github/CODEOWNERS | No extension | 90 bytes | 2026-10-09 00:26 |
| .github/dependabot.yml | .yml | 425 bytes | 2026-10-09 00:26 |
| .github/workflows/ci.yml | .yml | 1,054 bytes | 2026-10-09 00:26 |
| .gitignore | .gitignore | 516 bytes | 2026-10-11 17:12 |
| AGENTS.md | .md | 4,519 bytes | 2026-10-10 02:15 |
| backend/.admin-token | .admin-token | 47 bytes | 2026-10-09 01:13 |
| backend/.dockerignore | .dockerignore | 191 bytes | 2026-10-09 01:54 |
| backend/.env | .env | 2,177 bytes | 2026-10-12 22:34 |
| backend/.env.example | .example | 1,802 bytes | 2026-10-09 00:17 |
| backend/.gitignore | .gitignore | 619 bytes | 2026-10-09 01:13 |
| backend/backups/flash-backup-2026-10-08T21-17-36.json.enc | .enc | 270,456 bytes | 2026-10-09 00:17 |
| backend/deploy/README.md | .md | 2,957 bytes | 2026-10-09 01:57 |
| backend/diag.mjs | .mjs | 988 bytes | 2026-10-09 00:32 |
| backend/Dockerfile | No extension | 1,002 bytes | 2026-10-09 01:54 |
| backend/install-bonus.ps1 | .ps1 | 0 bytes | 2026-10-11 00:14 |
| backend/package.json | .json | 1,082 bytes | 2026-10-09 02:11 |
| backend/package-lock.json | .json | 54,738 bytes | 2026-10-09 00:36 |
| backend/render.yaml | .yaml | 1,513 bytes | 2026-10-09 01:54 |
| backend/scripts/audit-db.ts | .ts | 8,507 bytes | 2026-10-09 00:00 |
| backend/scripts/backup-db.ts | .ts | 3,869 bytes | 2026-10-09 00:17 |
| backend/scripts/golden-tests.ts | .ts | 5,176 bytes | 2026-10-09 02:11 |
| backend/scripts/setup-owner.ts | .ts | 1,600 bytes | 2026-10-09 01:11 |
| backend/scripts/verify-catalog.ts | .ts | 535 bytes | 2026-10-08 15:21 |
| backend/scripts/verify-db.ts | .ts | 971 bytes | 2026-10-08 22:57 |
| backend/scripts/verify-seed.ts | .ts | 772 bytes | 2026-10-09 00:00 |
| backend/SECURITY.md | .md | 1,511 bytes | 2026-10-09 00:09 |
| backend/src/catalog/_meta.ts | .ts | 15,943 bytes | 2026-10-08 15:26 |
| backend/src/catalog/_migrate.ts | .ts | 7,479 bytes | 2026-10-08 15:06 |
| backend/src/catalog/games/alternative-uses.ts | .ts | 4,622 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/argument-analyzer.ts | .ts | 4,724 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/block-counter.ts | .ts | 4,450 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/color-match.ts | .ts | 4,938 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/corsi-blocks.ts | .ts | 4,399 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/creative-connect.ts | .ts | 4,941 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/deduction.ts | .ts | 4,593 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/digit-span.ts | .ts | 3,133 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/empathy-engine.ts | .ts | 4,672 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/face-match.ts | .ts | 4,547 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/flanker.ts | .ts | 4,920 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/flash-cards.ts | .ts | 3,131 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/gear-logic.ts | .ts | 4,293 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/go-no-go.ts | .ts | 4,666 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/hanoi.ts | .ts | 4,200 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/idea-flow.ts | .ts | 4,621 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/lexical-decision.ts | .ts | 4,921 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/map-memory.ts | .ts | 4,388 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/matrix-logic.ts | .ts | 4,749 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/mental-math.ts | .ts | 3,203 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/mental-rotation.ts | .ts | 4,549 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/micro-expressions.ts | .ts | 4,704 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/n-back.ts | .ts | 4,686 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/num-chains.ts | .ts | 3,176 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/path-finder.ts | .ts | 4,535 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/pattern-recall.ts | .ts | 4,733 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/rapid-fire.ts | .ts | 4,644 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/reaction.ts | .ts | 4,442 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/river-crossing.ts | .ts | 4,726 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/seq-mem.ts | .ts | 4,648 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/social-read.ts | .ts | 4,587 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/speed-calc.ts | .ts | 3,173 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/story-spark.ts | .ts | 4,496 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/syllogisms.ts | .ts | 4,620 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/symbol-sprint.ts | .ts | 4,646 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/task-switching.ts | .ts | 4,732 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/tone-detector.ts | .ts | 4,634 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/truth-tbl.ts | .ts | 3,180 bytes | 2026-10-11 00:14 |
| backend/src/catalog/games/verbal-analogies.ts | .ts | 5,154 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/vigilance.ts | .ts | 4,688 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/vocabulary-elite.ts | .ts | 5,004 bytes | 2026-10-08 15:27 |
| backend/src/catalog/games/word-scramble.ts | .ts | 4,572 bytes | 2026-10-08 15:27 |
| backend/src/catalog/index.ts | .ts | 450 bytes | 2026-10-08 15:01 |
| backend/src/catalog/registry.ts | .ts | 8,361 bytes | 2026-10-11 00:14 |
| backend/src/catalog/types.ts | .ts | 3,767 bytes | 2026-10-08 15:01 |
| backend/src/config/db.ts | .ts | 1,106 bytes | 2026-10-09 00:56 |
| backend/src/config/env.ts | .ts | 1,681 bytes | 2026-10-09 00:06 |
| backend/src/config/rate-limit.ts | .ts | 1,523 bytes | 2026-10-09 00:43 |
| backend/src/lib/error-handler.ts | .ts | 3,463 bytes | 2026-10-11 18:06 |
| backend/src/lib/errors.ts | .ts | 6,461 bytes | 2026-10-11 18:06 |
| backend/src/middleware/admin-auth.ts | .ts | 2,133 bytes | 2026-10-09 01:08 |
| backend/src/middleware/auth.ts | .ts | 2,096 bytes | 2026-10-09 01:17 |
| backend/src/middleware/idempotency.ts | .ts | 2,263 bytes | 2026-10-11 18:17 |
| backend/src/middleware/step-up.ts | .ts | 1,696 bytes | 2026-10-09 01:57 |
| backend/src/migrate.ts | .ts | 3,451 bytes | 2026-10-09 00:21 |
| backend/src/migrations/001_identity.sql | .sql | 664 bytes | 2026-10-06 05:02 |
| backend/src/migrations/002_catalog.sql | .sql | 1,780 bytes | 2026-10-06 05:02 |
| backend/src/migrations/003_facts.sql | .sql | 1,747 bytes | 2026-10-06 05:02 |
| backend/src/migrations/004_derived.sql | .sql | 2,936 bytes | 2026-10-06 05:02 |
| backend/src/migrations/005_ai.sql | .sql | 1,675 bytes | 2026-10-06 05:02 |
| backend/src/migrations/006_difficulty.sql | .sql | 2,042 bytes | 2026-10-06 07:24 |
| backend/src/migrations/007_ai_coach.sql | .sql | 886 bytes | 2026-10-07 13:27 |
| backend/src/migrations/008_ai_extended.sql | .sql | 6,262 bytes | 2026-10-07 17:01 |
| backend/src/migrations/009_predictions_enhanced.sql | .sql | 1,536 bytes | 2026-10-08 14:05 |
| backend/src/migrations/010_soft_delete_and_indexes.sql | .sql | 1,712 bytes | 2026-10-08 14:59 |
| backend/src/migrations/011_games_defaults.sql | .sql | 1,594 bytes | 2026-10-08 15:06 |
| backend/src/migrations/012_migration_checksums.sql | .sql | 264 bytes | 2026-10-09 00:21 |
| backend/src/migrations/013_admin_bootstrap.sql | .sql | 2,128 bytes | 2026-10-09 01:08 |
| backend/src/migrations/014_player_auth.sql | .sql | 2,221 bytes | 2026-10-09 01:16 |
| backend/src/migrations/015_tickets_v2.sql | .sql | 953 bytes | 2026-10-09 01:20 |
| backend/src/migrations/016_fix_play_tickets.sql | .sql | 610 bytes | 2026-10-09 01:26 |
| backend/src/migrations/017_session_reviews.sql | .sql | 783 bytes | 2026-10-09 01:42 |
| backend/src/migrations/018_norms_pipeline.sql | .sql | 536 bytes | 2026-10-09 01:43 |
| backend/src/migrations/019_metric_daily.sql | .sql | 465 bytes | 2026-10-09 01:44 |
| backend/src/migrations/020_feature_flags.sql | .sql | 1,061 bytes | 2026-10-09 01:45 |
| backend/src/migrations/021_ai_usage.sql | .sql | 877 bytes | 2026-10-09 01:48 |
| backend/src/migrations/022_job_runs.sql | .sql | 911 bytes | 2026-10-09 01:51 |
| backend/src/migrations/023_privacy_requests.sql | .sql | 773 bytes | 2026-10-09 01:59 |
| backend/src/routes/admin-ai.ts | .ts | 2,156 bytes | 2026-10-09 01:48 |
| backend/src/routes/admin-analytics.ts | .ts | 1,880 bytes | 2026-10-09 01:44 |
| backend/src/routes/admin-auth.ts | .ts | 6,546 bytes | 2026-10-09 01:08 |
| backend/src/routes/admin-catalog.ts | .ts | 3,842 bytes | 2026-10-08 15:28 |
| backend/src/routes/admin-console.ts | .ts | 2,963 bytes | 2026-10-09 01:59 |
| backend/src/routes/admin-demo.ts | .ts | 4,343 bytes | 2026-10-09 01:57 |
| backend/src/routes/admin-demo-scripts.ts | .ts | 2,084 bytes | 2026-10-09 01:51 |
| backend/src/routes/admin-difficulty.ts | .ts | 5,296 bytes | 2026-10-09 01:40 |
| backend/src/routes/admin-flags.ts | .ts | 2,651 bytes | 2026-10-09 01:48 |
| backend/src/routes/admin-integrity.ts | .ts | 5,032 bytes | 2026-10-09 01:42 |
| backend/src/routes/admin-jobs.ts | .ts | 1,899 bytes | 2026-10-09 01:51 |
| backend/src/routes/admin-norms.ts | .ts | 2,909 bytes | 2026-10-09 01:57 |
| backend/src/routes/admin-platform.ts | .ts | 3,731 bytes | 2026-10-09 02:12 |
| backend/src/routes/admin-privacy.ts | .ts | 1,414 bytes | 2026-10-09 01:48 |
| backend/src/routes/admin-registry.ts | .ts | 2,679 bytes | 2026-10-09 01:36 |
| backend/src/routes/admin-retention.ts | .ts | 2,127 bytes | 2026-10-09 01:57 |
| backend/src/routes/ai.ts | .ts | 6,839 bytes | 2026-10-07 21:52 |
| backend/src/routes/ai-coach.ts | .ts | 2,495 bytes | 2026-10-07 17:01 |
| backend/src/routes/ai-director.ts | .ts | 10,017 bytes | 2026-10-07 22:20 |
| backend/src/routes/ai-journal.ts | .ts | 4,291 bytes | 2026-10-08 13:59 |
| backend/src/routes/ai-predictions.ts | .ts | 2,246 bytes | 2026-10-08 14:06 |
| backend/src/routes/ai-profile.ts | .ts | 10,806 bytes | 2026-10-08 13:51 |
| backend/src/routes/ai-variants.ts | .ts | 4,120 bytes | 2026-10-08 13:56 |
| backend/src/routes/ai-voice.ts | .ts | 3,790 bytes | 2026-10-07 22:26 |
| backend/src/routes/auth.ts | .ts | 3,244 bytes | 2026-10-09 01:19 |
| backend/src/routes/games.ts | .ts | 2,507 bytes | 2026-10-09 00:38 |
| backend/src/routes/health.ts | .ts | 1,661 bytes | 2026-10-09 00:36 |
| backend/src/routes/health.ts.pre-step1.5 | .5 | 487 bytes | 2026-10-06 04:36 |
| backend/src/routes/me.ts | .ts | 1,710 bytes | 2026-10-09 01:59 |
| backend/src/routes/next.ts | .ts | 2,534 bytes | 2026-10-06 07:27 |
| backend/src/routes/plan.ts | .ts | 648 bytes | 2026-10-07 13:11 |
| backend/src/routes/plays.ts | .ts | 3,234 bytes | 2026-10-09 01:20 |
| backend/src/routes/profile.ts | .ts | 1,913 bytes | 2026-10-06 05:32 |
| backend/src/routes/profile-snapshot.ts | .ts | 1,360 bytes | 2026-10-08 14:35 |
| backend/src/routes/sessions.ts | .ts | 7,180 bytes | 2026-10-11 18:10 |
| backend/src/routes/sessions.ts.bak-pre-error-sys | .bak-pre-error-sys | 7,175 bytes | 2026-10-09 02:13 |
| backend/src/routes/sessions.ts.pre-r03c | .pre-r03c | 6,378 bytes | 2026-10-09 00:56 |
| backend/src/routes/sessions.ts.pre-r05 | .pre-r05 | 5,283 bytes | 2026-10-08 14:59 |
| backend/src/routes/sessions.ts.pre-s12fix | .pre-s12fix | 7,240 bytes | 2026-10-09 01:53 |
| backend/src/routes/sync.ts | .ts | 3,842 bytes | 2026-10-09 01:41 |
| backend/src/schemas/session.ts | .ts | 1,244 bytes | 2026-10-06 05:13 |
| backend/src/scripts/sync-catalog.ts | .ts | 1,318 bytes | 2026-10-08 15:28 |
| backend/src/seed.ts | .ts | 13,210 bytes | 2026-10-06 05:09 |
| backend/src/seed-atlas.ts | .ts | 1,361 bytes | 2026-10-07 12:11 |
| backend/src/server.ts | .ts | 6,871 bytes | 2026-10-11 18:17 |
| backend/src/server.ts.pre-r11 | .pre-r11 | 3,648 bytes | 2026-10-09 00:36 |
| backend/src/services/admin-auth.ts | .ts | 3,397 bytes | 2026-10-09 01:08 |
| backend/src/services/ai/coach.ts | .ts | 6,047 bytes | 2026-10-07 21:45 |
| backend/src/services/ai/context.ts | .ts | 6,724 bytes | 2026-10-07 13:37 |
| backend/src/services/ai/daily-plan.ts | .ts | 16,648 bytes | 2026-10-08 15:15 |
| backend/src/services/ai/director/decider.ts | .ts | 22,526 bytes | 2026-10-07 22:38 |
| backend/src/services/ai/director/prompts.ts | .ts | 12,519 bytes | 2026-10-07 22:14 |
| backend/src/services/ai/director/session.ts | .ts | 3,508 bytes | 2026-10-07 22:36 |
| backend/src/services/ai/director/types.ts | .ts | 3,982 bytes | 2026-10-07 22:14 |
| backend/src/services/ai/error-patterns.ts | .ts | 16,117 bytes | 2026-10-07 22:32 |
| backend/src/services/ai/fallback-policy.ts | .ts | 4,698 bytes | 2026-10-12 01:02 |
| backend/src/services/ai/fingerprint.ts | .ts | 16,200 bytes | 2026-10-08 15:15 |
| backend/src/services/ai/gemini-client.ts | .ts | 3,763 bytes | 2026-10-07 14:03 |
| backend/src/services/ai/generate.ts | .ts | 6,404 bytes | 2026-10-07 21:45 |
| backend/src/services/ai/groq-client.ts | .ts | 2,869 bytes | 2026-10-07 15:50 |
| backend/src/services/ai/health.ts | .ts | 1,829 bytes | 2026-10-07 17:32 |
| backend/src/services/ai/insights.ts | .ts | 11,337 bytes | 2026-10-07 21:44 |
| backend/src/services/ai/journal.ts | .ts | 13,356 bytes | 2026-10-08 14:02 |
| backend/src/services/ai/lab.ts | .ts | 15,280 bytes | 2026-10-08 15:17 |
| backend/src/services/ai/micro-lessons.ts | .ts | 15,430 bytes | 2026-10-07 22:45 |
| backend/src/services/ai/nudge.ts | .ts | 5,455 bytes | 2026-10-07 17:37 |
| backend/src/services/ai/predictions.ts | .ts | 23,210 bytes | 2026-10-08 14:15 |
| backend/src/services/ai/prompts.ts | .ts | 1,249 bytes | 2026-10-07 10:10 |
| backend/src/services/ai/prompts-base.ts | .ts | 6,344 bytes | 2026-10-06 06:41 |
| backend/src/services/ai/prompts-daily-plan.ts | .ts | 6,611 bytes | 2026-10-07 16:30 |
| backend/src/services/ai/prompts-error-patterns.ts | .ts | 4,048 bytes | 2026-10-07 22:29 |
| backend/src/services/ai/prompts-extended.ts | .ts | 19,810 bytes | 2026-10-07 10:19 |
| backend/src/services/ai/prompts-fingerprint.ts | .ts | 6,088 bytes | 2026-10-07 22:02 |
| backend/src/services/ai/prompts-insights.ts | .ts | 5,605 bytes | 2026-10-07 15:57 |
| backend/src/services/ai/prompts-journal.ts | .ts | 6,701 bytes | 2026-10-08 13:59 |
| backend/src/services/ai/prompts-lab.ts | .ts | 8,294 bytes | 2026-10-08 13:44 |
| backend/src/services/ai/prompts-micro-lessons.ts | .ts | 6,495 bytes | 2026-10-07 22:53 |
| backend/src/services/ai/prompts-nudge.ts | .ts | 3,549 bytes | 2026-10-07 17:01 |
| backend/src/services/ai/prompts-predictions.ts | .ts | 7,508 bytes | 2026-10-08 14:06 |
| backend/src/services/ai/prompts-recap.ts | .ts | 4,752 bytes | 2026-10-07 15:53 |
| backend/src/services/ai/prompts-transfer-tracker.ts | .ts | 5,077 bytes | 2026-10-07 22:55 |
| backend/src/services/ai/providers/gemini-provider.ts | .ts | 3,597 bytes | 2026-10-07 22:49 |
| backend/src/services/ai/providers/groq-provider.ts | .ts | 1,159 bytes | 2026-10-07 17:31 |
| backend/src/services/ai/providers/openrouter-provider.ts | .ts | 2,924 bytes | 2026-10-07 17:31 |
| backend/src/services/ai/providers/types.ts | .ts | 1,070 bytes | 2026-10-07 17:31 |
| backend/src/services/ai/recap.ts | .ts | 5,580 bytes | 2026-10-07 21:44 |
| backend/src/services/ai/router.ts | .ts | 4,874 bytes | 2026-10-08 15:16 |
| backend/src/services/ai/transfer-tracker.ts | .ts | 14,876 bytes | 2026-10-07 22:58 |
| backend/src/services/ai/validator.ts | .ts | 7,129 bytes | 2026-10-07 22:51 |
| backend/src/services/ai/variants/prompts.ts | .ts | 11,022 bytes | 2026-10-08 13:55 |
| backend/src/services/ai/variants/types.ts | .ts | 5,956 bytes | 2026-10-08 13:55 |
| backend/src/services/ai/variants/validators.ts | .ts | 6,763 bytes | 2026-10-08 13:55 |
| backend/src/services/ai/variants/variants.ts | .ts | 16,226 bytes | 2026-10-08 13:56 |
| backend/src/services/ai/voice/transcribe.ts | .ts | 2,875 bytes | 2026-10-07 22:24 |
| backend/src/services/ai/voice/voice-coach.ts | .ts | 3,193 bytes | 2026-10-07 22:26 |
| backend/src/services/ai-content-pool.ts | .ts | 2,616 bytes | 2026-10-09 01:45 |
| backend/src/services/ai-usage.ts | .ts | 5,211 bytes | 2026-10-09 01:48 |
| backend/src/services/analytics.ts | .ts | 4,990 bytes | 2026-10-09 01:44 |
| backend/src/services/auth.ts | .ts | 6,882 bytes | 2026-10-09 01:17 |
| backend/src/services/badges.ts | .ts | 1,720 bytes | 2026-10-06 05:22 |
| backend/src/services/cache.ts | .ts | 2,066 bytes | 2026-10-09 00:38 |
| backend/src/services/catalog-sync.ts | .ts | 6,789 bytes | 2026-10-08 15:28 |
| backend/src/services/claims-lexicon.ts | .ts | 2,836 bytes | 2026-10-09 01:30 |
| backend/src/services/demo-scripts.ts | .ts | 3,106 bytes | 2026-10-09 01:51 |
| backend/src/services/derive.ts | .ts | 2,635 bytes | 2026-10-06 05:13 |
| backend/src/services/difficulty/atlas.ts | .ts | 19,525 bytes | 2026-10-07 12:11 |
| backend/src/services/difficulty/engine.ts | .ts | 7,320 bytes | 2026-10-06 07:25 |
| backend/src/services/feature-flags.ts | .ts | 3,370 bytes | 2026-10-09 01:46 |
| backend/src/services/ingestion-validator.ts | .ts | 3,754 bytes | 2026-10-09 01:31 |
| backend/src/services/integrity-rules.ts | .ts | 2,902 bytes | 2026-10-09 01:51 |
| backend/src/services/integrity-rules.ts.bak-pre-error-sys | .bak-pre-error-sys | 2,902 bytes | 2026-10-09 01:51 |
| backend/src/services/job-runner.ts | .ts | 4,768 bytes | 2026-10-09 01:51 |
| backend/src/services/norms.ts | .ts | 5,803 bytes | 2026-10-09 01:43 |
| backend/src/services/pb.ts | .ts | 2,032 bytes | 2026-10-06 05:22 |
| backend/src/services/planner.ts | .ts | 8,717 bytes | 2026-10-07 12:03 |
| backend/src/services/privacy.ts | .ts | 7,431 bytes | 2026-10-09 01:48 |
| backend/src/services/privacy-player.ts | .ts | 6,161 bytes | 2026-10-09 02:03 |
| backend/src/services/profile/snapshot.ts | .ts | 25,473 bytes | 2026-10-08 14:35 |
| backend/src/services/profile/types.ts | .ts | 2,502 bytes | 2026-10-08 14:35 |
| backend/src/services/recommendations.ts | .ts | 6,952 bytes | 2026-10-08 15:15 |
| backend/src/services/retention.ts | .ts | 3,141 bytes | 2026-10-09 01:57 |
| backend/src/services/sanitize.ts | .ts | 2,371 bytes | 2026-10-09 00:23 |
| backend/src/services/stats.ts | .ts | 7,518 bytes | 2026-10-08 14:59 |
| backend/src/services/tickets.ts | .ts | 4,134 bytes | 2026-10-09 01:20 |
| backend/src/services/trial-stats.ts | .ts | 2,958 bytes | 2026-10-09 01:33 |
| backend/src/services/user-lock.ts | .ts | 1,178 bytes | 2026-10-09 00:56 |
| backend/src/services/users.ts | .ts | 859 bytes | 2026-10-06 05:14 |
| backend/test.ps1 | .ps1 | 6,122 bytes | 2026-10-09 00:16 |
| backend/test-catalog.ps1 | .ps1 | 4,161 bytes | 2026-10-09 00:40 |
| backend/test-health.ps1 | .ps1 | 2,626 bytes | 2026-10-09 00:29 |
| backend/test-r05.mjs | .mjs | 2,370 bytes | 2026-10-09 00:56 |
| backend/test-rate-limit.ps1 | .ps1 | 3,991 bytes | 2026-10-09 00:44 |
| backend/test-security.ps1 | .ps1 | 2,332 bytes | 2026-10-09 00:26 |
| backend/tsconfig.json | .json | 587 bytes | 2026-10-06 04:29 |
| backend/verify.ps1 | .ps1 | 2,773 bytes | 2026-10-08 22:57 |
| create-game.bat | .bat | 1,534 bytes | 2026-10-06 03:50 |
| design-v4/flash.css | .css | 7,444 bytes | 2026-10-12 13:56 |
| design-v4/FLASH.html | .html | 863 bytes | 2026-10-09 18:19 |
| design-v4/flash-cortex-reef.html | .html | 31,995 bytes | 2026-10-10 02:23 |
| design-v4/flash-main-dashboard.html | .html | 42,733 bytes | 2026-10-10 06:36 |
| design-v4/flash-main-dashboard-NEW.html | .html | 42,483 bytes | 2026-10-10 06:23 |
| design-v4/js/flash-core.js | .js | 9,601 bytes | 2026-10-09 18:19 |
| design-v4/js/flash-data.js | .js | 5,868 bytes | 2026-10-09 18:19 |
| docs/00_INDEX.md | .md | 3,981 bytes | 2026-10-09 21:21 |
| docs/01_ARCHITECTURE/01_CORE_ARCHITECTURE.md | .md | 5,254 bytes | 2026-10-04 02:12 |
| docs/01_ARCHITECTURE/02_STRATEGY_AND_ARCHITECTURE.md | .md | 15,723 bytes | 2026-10-06 04:27 |
| docs/01_ARCHITECTURE/03_SYSTEM_ARCHITECTURE.md | .md | 5,899 bytes | 2026-10-07 15:15 |
| docs/02_CONTRACTS/01_SESSION_SCHEMA.md | .md | 8,032 bytes | 2026-10-06 04:06 |
| docs/02_CONTRACTS/02_TRIAL_SCHEMA.md | .md | 11,428 bytes | 2026-10-06 04:07 |
| docs/02_CONTRACTS/03_POSTMESSAGE_PROTOCOL.md | .md | 10,666 bytes | 2026-10-06 04:14 |
| docs/02_CONTRACTS/04_GAME_CATALOG.md | .md | 8,132 bytes | 2026-10-06 04:15 |
| docs/03_BACKEND/01_FOUNDATION.md | .md | 1,916 bytes | 2026-10-06 05:19 |
| docs/03_BACKEND/02_HANDOFF_v1.md | .md | 19,433 bytes | 2026-10-07 21:54 |
| docs/03_BACKEND/03_HANDOFF_v2.md | .md | 26,486 bytes | 2026-10-08 14:26 |
| docs/03_BACKEND/04_HANDOFF_v3.md | .md | 6,755 bytes | 2026-10-08 23:08 |
| docs/03_BACKEND/05_HANDOFF_v4.md | .md | 9,770 bytes | 2026-10-09 02:17 |
| docs/03_BACKEND/06_HANDOFF_v4.1.md | .md | 20,697 bytes | 2026-10-09 21:10 |
| docs/03_BACKEND/07_FIX_LOG.md | .md | 8,686 bytes | 2026-10-08 15:22 |
| docs/04_AI_SYSTEM/01_PLAYER_INTELLIGENCE.md | .md | 16,506 bytes | 2026-10-06 07:22 |
| docs/04_AI_SYSTEM/02_ADAPTIVE_ENGINE.md | .md | 14,189 bytes | 2026-10-07 10:55 |
| docs/04_AI_SYSTEM/03_AI_CONTRACTS.md | .md | 38,864 bytes | 2026-10-07 22:55 |
| docs/05_FRONTEND/01_ROADMAP_AND_STATUS.md | .md | 5,182 bytes | 2026-10-04 02:13 |
| docs/05_FRONTEND/02_WORKFLOW_AND_RULES.md | .md | 4,354 bytes | 2026-10-04 02:14 |
| docs/06_PROJECT_HISTORY/01_OVERVIEW.md | .md | 4,485 bytes | 2026-10-07 15:13 |
| docs/06_PROJECT_HISTORY/02_HISTORY.md | .md | 5,980 bytes | 2026-10-07 15:14 |
| docs/06_PROJECT_HISTORY/03_EVOLUTION.md | .md | 6,094 bytes | 2026-10-08 23:09 |
| docs/06_PROJECT_HISTORY/04_LEGACY_REFERENCE.md | .md | 52,978 bytes | 2026-10-07 15:18 |
| docs/06_PROJECT_HISTORY/05_LEGACY_INDEX.md | .md | 2,874 bytes | 2026-10-07 15:13 |
| docs/07_SESSIONS/01_RECENT_SESSION.md | .md | 9,009 bytes | 2026-10-07 15:03 |
| docs/07_SESSIONS/02_SESSION_LOG_v1.md | .md | 21,770 bytes | 2026-10-09 21:06 |
| docs/08_STATS_AND_TREES/01_STATS.md | .md | 2,339 bytes | 2026-10-07 14:57 |
| docs/08_STATS_AND_TREES/02_TREE.md | .md | 21,821 bytes | 2026-10-07 15:04 |
| docs/08_STATS_AND_TREES/03_TREE_FULL.md | .md | 20,613 bytes | 2026-10-07 15:32 |
| docs/08_STATS_AND_TREES/04_TREE_RAW.txt | .txt | 28,695 bytes | 2026-10-08 23:45 |
| docs/08_STATS_AND_TREES/05_TREE_SIMPLE.txt | .txt | 177,395 bytes | 2026-10-08 23:42 |
| docs/08_STATS_AND_TREES/06_FOLDERS.txt | .txt | 3,600 bytes | 2026-10-08 23:44 |
| docs/08_STATS_AND_TREES/07_PATHS.txt | .txt | 28,932 bytes | 2026-10-08 23:43 |
| docs/08_STATS_AND_TREES/08_TOTAL_REFERENCE.md | .md | 48,174 bytes | 2026-10-04 02:18 |
| docs/BACKEND_HANDOFF_v4.1.md | .md | 0 bytes | 2026-10-09 23:14 |
| docs/DOCS_TREE.txt | .txt | 4,251 bytes | 2026-10-09 21:23 |
| docs/FLASH_PROJECT_MEMORY_EXPORT_2026-10-13.txt | .txt | 75,706 bytes | 2026-10-13 01:20 |
| docs/FULL_BUILD_LOG.md | .md | 20,058 bytes | 2026-10-11 01:48 |
| favicon.ico | .ico | 71 bytes | 2026-10-12 01:20 |
| FLASH_DIAGNOSTIC_2026-10-12_12-01.txt | .txt | 10,279 bytes | 2026-10-12 12:01 |
| frontend/dashboard/_legacy/flash.css | .css | 31,638 bytes | 2026-10-02 15:26 |
| frontend/dashboard/_legacy/FLASH.html | .html | 28,839 bytes | 2026-10-11 00:44 |
| frontend/dashboard/_legacy/FLASH-old.html | .html | 5,999 bytes | 2026-09-24 02:53 |
| frontend/dashboard/_legacy/js__flash-charts.js | .js | 6,328 bytes | 2026-09-23 01:14 |
| frontend/dashboard/_legacy/js__flash-core.js | .js | 13,598 bytes | 2026-10-04 11:09 |
| frontend/dashboard/_legacy/js__flash-data.js | .js | 29,544 bytes | 2026-10-11 00:23 |
| frontend/dashboard/_legacy/js__flash-data.js.backup | .backup | 26,104 bytes | 2026-10-06 11:28 |
| frontend/dashboard/404.html | .html | 1,836 bytes | 2026-10-11 01:33 |
| frontend/dashboard/ai-lab.html | .html | 1,525 bytes | 2026-10-12 23:00 |
| frontend/dashboard/assets/icon-192.svg | .svg | 1,019 bytes | 2026-10-11 01:32 |
| frontend/dashboard/assets/icon-512.svg | .svg | 1,031 bytes | 2026-10-11 01:32 |
| frontend/dashboard/auth.html | .html | 6,080 bytes | 2026-10-11 17:37 |
| frontend/dashboard/css/base.css | .css | 1,754 bytes | 2026-10-11 01:04 |
| frontend/dashboard/css/layout.css | .css | 7,025 bytes | 2026-10-12 01:38 |
| frontend/dashboard/css/layout.css.bak-fullwidth | .bak-fullwidth | 5,631 bytes | 2026-10-12 01:25 |
| frontend/dashboard/css/modules/a11y.css | .css | 1,344 bytes | 2026-10-12 01:14 |
| frontend/dashboard/css/modules/ai-chat.css | .css | 10,667 bytes | 2026-10-12 01:34 |
| frontend/dashboard/css/modules/ai-lab.css | .css | 3,528 bytes | 2026-10-12 23:00 |
| frontend/dashboard/css/modules/ai-panels-live.css | .css | 1,619 bytes | 2026-10-12 22:39 |
| frontend/dashboard/css/modules/ambient.css | .css | 2,117 bytes | 2026-10-11 01:09 |
| frontend/dashboard/css/modules/ambient-pack-v2.css | .css | 6,112 bytes | 2026-10-11 17:49 |
| frontend/dashboard/css/modules/auth.css | .css | 12,704 bytes | 2026-10-11 17:37 |
| frontend/dashboard/css/modules/auth-guard.css | .css | 3,052 bytes | 2026-10-11 17:39 |
| frontend/dashboard/css/modules/brain.css | .css | 1,077 bytes | 2026-10-11 01:15 |
| frontend/dashboard/css/modules/brain-alt.css | .css | 2,574 bytes | 2026-10-11 17:49 |
| frontend/dashboard/css/modules/brain-v3.css | .css | 1,340 bytes | 2026-10-11 17:41 |
| frontend/dashboard/css/modules/brain-v3-force.css | .css | 609 bytes | 2026-10-12 01:38 |
| frontend/dashboard/css/modules/chat-extras.css | .css | 3,776 bytes | 2026-10-12 22:55 |
| frontend/dashboard/css/modules/cheat-sheet.css | .css | 2,300 bytes | 2026-10-11 01:28 |
| frontend/dashboard/css/modules/command-palette.css | .css | 3,568 bytes | 2026-10-11 01:20 |
| frontend/dashboard/css/modules/daily-plan.css | .css | 2,155 bytes | 2026-10-12 22:44 |
| frontend/dashboard/css/modules/data-io.css | .css | 638 bytes | 2026-10-11 01:34 |
| frontend/dashboard/css/modules/director.css | .css | 2,453 bytes | 2026-10-12 23:01 |
| frontend/dashboard/css/modules/domain-compare.css | .css | 3,421 bytes | 2026-10-11 01:27 |
| frontend/dashboard/css/modules/domain-games.css | .css | 2,723 bytes | 2026-10-11 01:54 |
| frontend/dashboard/css/modules/error-page.css | .css | 7,051 bytes | 2026-10-12 01:11 |
| frontend/dashboard/css/modules/error-ui.css | .css | 13,271 bytes | 2026-10-11 18:05 |
| frontend/dashboard/css/modules/export-snapshot.css | .css | 1,522 bytes | 2026-10-11 01:24 |
| frontend/dashboard/css/modules/fingerprint.css | .css | 4,590 bytes | 2026-10-12 22:45 |
| frontend/dashboard/css/modules/focus-mode.css | .css | 2,471 bytes | 2026-10-11 01:24 |
| frontend/dashboard/css/modules/full-width.css | .css | 2,472 bytes | 2026-10-11 17:35 |
| frontend/dashboard/css/modules/grid-fix.css | .css | 996 bytes | 2026-10-12 23:05 |
| frontend/dashboard/css/modules/interactions.css | .css | 2,859 bytes | 2026-10-11 01:13 |
| frontend/dashboard/css/modules/layout-override.css | .css | 1,772 bytes | 2026-10-12 23:18 |
| frontend/dashboard/css/modules/live-status.css | .css | 3,017 bytes | 2026-10-11 01:57 |
| frontend/dashboard/css/modules/micro-lessons.css | .css | 1,391 bytes | 2026-10-12 22:44 |
| frontend/dashboard/css/modules/milestone.css | .css | 1,707 bytes | 2026-10-11 01:27 |
| frontend/dashboard/css/modules/mobile.css | .css | 2,885 bytes | 2026-10-11 01:19 |
| frontend/dashboard/css/modules/navigation.css | .css | 2,139 bytes | 2026-10-11 01:17 |
| frontend/dashboard/css/modules/nudge.css | .css | 1,068 bytes | 2026-10-12 23:01 |
| frontend/dashboard/css/modules/onboarding.css | .css | 2,576 bytes | 2026-10-11 01:34 |
| frontend/dashboard/css/modules/print.css | .css | 2,181 bytes | 2026-10-11 01:29 |
| frontend/dashboard/css/modules/provider-status.css | .css | 1,374 bytes | 2026-10-12 01:02 |
| frontend/dashboard/css/modules/pwa.css | .css | 2,108 bytes | 2026-10-11 01:32 |
| frontend/dashboard/css/modules/rtl-polish.css | .css | 2,018 bytes | 2026-10-11 01:19 |
| frontend/dashboard/css/modules/session-detail.css | .css | 2,948 bytes | 2026-10-11 01:34 |
| frontend/dashboard/css/modules/session-hud.css | .css | 2,223 bytes | 2026-10-11 01:26 |
| frontend/dashboard/css/modules/session-progress.css | .css | 2,027 bytes | 2026-10-11 01:21 |
| frontend/dashboard/css/modules/session-recap.css | .css | 2,485 bytes | 2026-10-12 22:54 |
| frontend/dashboard/css/modules/settings-panel.css | .css | 4,631 bytes | 2026-10-11 01:32 |
| frontend/dashboard/css/modules/single-view.css | .css | 2,895 bytes | 2026-10-12 23:21 |
| frontend/dashboard/css/modules/split-pane.css | .css | 4,333 bytes | 2026-10-11 01:16 |
| frontend/dashboard/css/modules/streak-break.css | .css | 2,388 bytes | 2026-10-11 01:17 |
| frontend/dashboard/css/modules/streak-ring.css | .css | 1,329 bytes | 2026-10-11 01:12 |
| frontend/dashboard/css/modules/theme-transition.css | .css | 769 bytes | 2026-10-11 01:08 |
| frontend/dashboard/css/modules/variants.css | .css | 1,035 bytes | 2026-10-12 23:00 |
| frontend/dashboard/css/modules/week-heatmap.css | .css | 2,054 bytes | 2026-10-11 01:21 |
| frontend/dashboard/css/modules/wide-panels.css | .css | 5,126 bytes | 2026-10-11 17:51 |
| frontend/dashboard/css/modules/xp-gain.css | .css | 1,110 bytes | 2026-10-11 01:18 |
| frontend/dashboard/css/panels/recent.css | .css | 1,173 bytes | 2026-10-11 01:06 |
| frontend/dashboard/css/panels/season.css | .css | 2,902 bytes | 2026-10-11 01:06 |
| frontend/dashboard/css/panels/today.css | .css | 1,775 bytes | 2026-10-11 01:06 |
| frontend/dashboard/css/tokens.css | .css | 2,786 bytes | 2026-10-11 01:04 |
| frontend/dashboard/domain.html | .html | 17,716 bytes | 2026-10-12 01:03 |
| frontend/dashboard/domain.html.bak-flashfix | .bak-flashfix | 17,716 bytes | 2026-10-11 01:34 |
| frontend/dashboard/domain.html.bak-pre-backfix | .bak-pre-backfix | 17,716 bytes | 2026-10-12 01:02 |
| frontend/dashboard/error.html | .html | 9,515 bytes | 2026-10-12 01:11 |
| frontend/dashboard/errors-demo.html | .html | 6,974 bytes | 2026-10-12 01:11 |
| frontend/dashboard/favicon.ico | .ico | 71 bytes | 2026-10-12 01:20 |
| frontend/dashboard/favicon.svg | .svg | 243 bytes | 2026-10-11 18:22 |
| frontend/dashboard/fingerprint.html | .html | 1,664 bytes | 2026-10-12 22:45 |
| frontend/dashboard/FLASH.html | .html | 1,356 bytes | 2026-10-12 01:10 |
| frontend/dashboard/index.html | .html | 8,354 bytes | 2026-10-12 23:21 |
| frontend/dashboard/index.html.bak-014604 | .bak-014604 | 7,039 bytes | 2026-10-12 01:40 |
| frontend/dashboard/index.html.bak-aichat | .bak-aichat | 8,530 bytes | 2026-10-12 01:34 |
| frontend/dashboard/index.html.bak-aipanels | .bak-aipanels | 7,275 bytes | 2026-10-12 01:50 |
| frontend/dashboard/index.html.bak-brain | .bak-brain | 8,472 bytes | 2026-10-12 01:24 |
| frontend/dashboard/index.html.bak-cachefix | .bak-cachefix | 9,352 bytes | 2026-10-12 01:22 |
| frontend/dashboard/index.html.bak-final | .bak-final | 7,039 bytes | 2026-10-12 01:40 |
| frontend/dashboard/index.html.bak-final-features | .bak-final-features | 7,987 bytes | 2026-10-12 22:56 |
| frontend/dashboard/index.html.bak-fullfix | .bak-fullfix | 8,635 bytes | 2026-10-12 01:34 |
| frontend/dashboard/index.html.bak-nuke | .bak-nuke | 7,721 bytes | 2026-10-12 01:38 |
| frontend/dashboard/index.html.bak-nuke2 | .bak-nuke2 | 7,251 bytes | 2026-10-12 01:48 |
| frontend/dashboard/index.html.bak-phase23 | .bak-phase23 | 7,394 bytes | 2026-10-12 22:39 |
| frontend/dashboard/index.html.bak-pre-reorder | .bak-pre-reorder | 7,784 bytes | 2026-10-11 18:23 |
| frontend/dashboard/index.html.bak-pre-script-fix | .bak-pre-script-fix | 7,779 bytes | 2026-10-11 18:30 |
| frontend/dashboard/index.html.bak-real | .bak-real | 7,039 bytes | 2026-10-12 01:40 |
| frontend/dashboard/index.html.bak-real-final | .bak-real-final | 7,251 bytes | 2026-10-12 01:46 |
| frontend/dashboard/index.html.bak-recap | .bak-recap | 7,716 bytes | 2026-10-12 22:51 |
| frontend/dashboard/js/api.js | .js | 6,823 bytes | 2026-10-11 18:31 |
| frontend/dashboard/js/api.js.bak-pre-error-sys | .bak-pre-error-sys | 4,797 bytes | 2026-10-11 18:06 |
| frontend/dashboard/js/api.js.bak-pre-error-system | .bak-pre-error-system | 4,525 bytes | 2026-10-11 01:56 |
| frontend/dashboard/js/config.js | .js | 1,156 bytes | 2026-10-11 01:56 |
| frontend/dashboard/js/core.js | .js | 2,690 bytes | 2026-10-11 01:04 |
| frontend/dashboard/js/data.js | .js | 14,914 bytes | 2026-10-11 01:54 |
| frontend/dashboard/js/domain-brain.js | .js | 6,487 bytes | 2026-10-11 01:34 |
| frontend/dashboard/js/i18n.js | .js | 1,787 bytes | 2026-10-11 01:04 |
| frontend/dashboard/js/inline-init.js | .js | 2,836 bytes | 2026-10-12 23:01 |
| frontend/dashboard/js/lib/errors.js | .js | 6,416 bytes | 2026-10-11 18:04 |
| frontend/dashboard/js/lib/safe-fetch.js | .js | 4,166 bytes | 2026-10-11 18:05 |
| frontend/dashboard/js/modules/a11y.js | .js | 2,463 bytes | 2026-10-12 01:14 |
| frontend/dashboard/js/modules/achievement-guard.js | .js | 5,332 bytes | 2026-10-12 01:02 |
| frontend/dashboard/js/modules/ai-chat.js | .js | 15,052 bytes | 2026-10-12 01:34 |
| frontend/dashboard/js/modules/ai-lab.js | .js | 4,577 bytes | 2026-10-12 23:00 |
| frontend/dashboard/js/modules/ai-panels-live.js | .js | 8,512 bytes | 2026-10-12 22:39 |
| frontend/dashboard/js/modules/ambient.js | .js | 3,639 bytes | 2026-10-11 01:09 |
| frontend/dashboard/js/modules/ambient-pack-v2.js | .js | 6,537 bytes | 2026-10-11 17:49 |
| frontend/dashboard/js/modules/audio-unlock.js | .js | 1,203 bytes | 2026-10-12 01:20 |
| frontend/dashboard/js/modules/auth.js | .js | 21,742 bytes | 2026-10-11 17:38 |
| frontend/dashboard/js/modules/auth-guard.js | .js | 11,238 bytes | 2026-10-11 17:40 |
| frontend/dashboard/js/modules/brain.js | .js | 10,244 bytes | 2026-10-11 01:18 |
| frontend/dashboard/js/modules/brain-alt.js | .js | 19,465 bytes | 2026-10-11 17:50 |
| frontend/dashboard/js/modules/brain-alt-panel.js | .js | 2,961 bytes | 2026-10-11 17:50 |
| frontend/dashboard/js/modules/brain-state.js | .js | 2,682 bytes | 2026-10-11 01:18 |
| frontend/dashboard/js/modules/brain-v3.js | .js | 17,266 bytes | 2026-10-11 17:41 |
| frontend/dashboard/js/modules/chat-extras.js | .js | 10,611 bytes | 2026-10-12 22:55 |
| frontend/dashboard/js/modules/cheat-sheet.js | .js | 4,976 bytes | 2026-10-11 01:28 |
| frontend/dashboard/js/modules/command-palette.js | .js | 9,787 bytes | 2026-10-11 01:20 |
| frontend/dashboard/js/modules/component-boundaries.js | .js | 2,720 bytes | 2026-10-12 01:13 |
| frontend/dashboard/js/modules/daily-plan.js | .js | 4,900 bytes | 2026-10-12 22:52 |
| frontend/dashboard/js/modules/data-io.js | .js | 3,468 bytes | 2026-10-11 01:34 |
| frontend/dashboard/js/modules/director.js | .js | 4,908 bytes | 2026-10-12 23:01 |
| frontend/dashboard/js/modules/domain-back.js | .js | 2,050 bytes | 2026-10-11 01:17 |
| frontend/dashboard/js/modules/domain-compare.js | .js | 5,089 bytes | 2026-10-11 01:27 |
| frontend/dashboard/js/modules/domain-games.js | .js | 3,632 bytes | 2026-10-11 01:54 |
| frontend/dashboard/js/modules/error-ui.js | .js | 12,999 bytes | 2026-10-11 18:05 |
| frontend/dashboard/js/modules/export-snapshot.js | .js | 4,397 bytes | 2026-10-11 01:24 |
| frontend/dashboard/js/modules/fingerprint.js | .js | 5,130 bytes | 2026-10-12 22:45 |
| frontend/dashboard/js/modules/focus-mode.js | .js | 2,670 bytes | 2026-10-11 01:24 |
| frontend/dashboard/js/modules/game-catalog-patch.js | .js | 4,430 bytes | 2026-10-11 17:47 |
| frontend/dashboard/js/modules/game-complete-bridge.js | .js | 7,018 bytes | 2026-10-11 18:17 |
| frontend/dashboard/js/modules/lang-flip.js | .js | 3,247 bytes | 2026-10-11 01:18 |
| frontend/dashboard/js/modules/live-data.js | .js | 5,915 bytes | 2026-10-11 01:57 |
| frontend/dashboard/js/modules/live-status.js | .js | 3,402 bytes | 2026-10-11 18:31 |
| frontend/dashboard/js/modules/live-status.js.bak-pre-guard | .bak-pre-guard | 3,322 bytes | 2026-10-11 01:57 |
| frontend/dashboard/js/modules/micro-lessons.js | .js | 3,654 bytes | 2026-10-12 22:52 |
| frontend/dashboard/js/modules/milestone.js | .js | 1,185 bytes | 2026-10-11 01:27 |
| frontend/dashboard/js/modules/mobile-nav.js | .js | 3,540 bytes | 2026-10-11 01:19 |
| frontend/dashboard/js/modules/multi-tab-sync.js | .js | 3,897 bytes | 2026-10-12 01:14 |
| frontend/dashboard/js/modules/navigation.js | .js | 3,539 bytes | 2026-10-11 01:17 |
| frontend/dashboard/js/modules/network-monitor.js | .js | 3,421 bytes | 2026-10-11 18:06 |
| frontend/dashboard/js/modules/neural-network-panel.js | .js | 2,535 bytes | 2026-10-11 17:41 |
| frontend/dashboard/js/modules/nudge.js | .js | 3,222 bytes | 2026-10-12 23:01 |
| frontend/dashboard/js/modules/onboarding.js | .js | 4,185 bytes | 2026-10-11 01:34 |
| frontend/dashboard/js/modules/provider-status.js | .js | 2,556 bytes | 2026-10-12 01:02 |
| frontend/dashboard/js/modules/pwa.js | .js | 156 bytes | 2026-10-12 22:56 |
| frontend/dashboard/js/modules/pwa.js.disabled-by-fix | .disabled-by-fix | 3,054 bytes | 2026-10-12 22:50 |
| frontend/dashboard/js/modules/recent.js | .js | 1,980 bytes | 2026-10-12 01:50 |
| frontend/dashboard/js/modules/recent.js.bak-final | .bak-final | 2,630 bytes | 2026-10-12 01:22 |
| frontend/dashboard/js/modules/recent.js.bak-v2 | .bak-v2 | 2,042 bytes | 2026-10-12 00:51 |
| frontend/dashboard/js/modules/reminder.js | .js | 2,981 bytes | 2026-10-11 01:47 |
| frontend/dashboard/js/modules/save-pill.js | .js | 2,116 bytes | 2026-10-12 01:13 |
| frontend/dashboard/js/modules/save-queue.js | .js | 6,579 bytes | 2026-10-11 18:06 |
| frontend/dashboard/js/modules/season.js | .js | 2,992 bytes | 2026-10-11 01:06 |
| frontend/dashboard/js/modules/session-detail.js | .js | 4,889 bytes | 2026-10-11 01:34 |
| frontend/dashboard/js/modules/session-hud.js | .js | 2,975 bytes | 2026-10-11 01:26 |
| frontend/dashboard/js/modules/session-progress.js | .js | 3,239 bytes | 2026-10-11 01:21 |
| frontend/dashboard/js/modules/session-recap.js | .js | 5,217 bytes | 2026-10-12 22:54 |
| frontend/dashboard/js/modules/session-restore.js | .js | 3,748 bytes | 2026-10-12 01:14 |
| frontend/dashboard/js/modules/settings-panel.js | .js | 11,153 bytes | 2026-10-11 01:34 |
| frontend/dashboard/js/modules/sound.js | .js | 4,239 bytes | 2026-10-11 01:24 |
| frontend/dashboard/js/modules/split-pane.js | .js | 6,690 bytes | 2026-10-11 01:16 |
| frontend/dashboard/js/modules/streak-break.js | .js | 3,278 bytes | 2026-10-11 01:17 |
| frontend/dashboard/js/modules/streak-ring.js | .js | 2,320 bytes | 2026-10-11 01:12 |
| frontend/dashboard/js/modules/tag-panels.js | .js | 2,251 bytes | 2026-10-12 22:51 |
| frontend/dashboard/js/modules/theme-transition.js | .js | 2,995 bytes | 2026-10-11 01:08 |
| frontend/dashboard/js/modules/timer-guard.js | .js | 6,791 bytes | 2026-10-12 01:02 |
| frontend/dashboard/js/modules/today.js | .js | 2,563 bytes | 2026-10-11 01:13 |
| frontend/dashboard/js/modules/variants.js | .js | 2,949 bytes | 2026-10-12 23:00 |
| frontend/dashboard/js/modules/week-heatmap.js | .js | 2,820 bytes | 2026-10-11 01:21 |
| frontend/dashboard/js/modules/wide-panels.js | .js | 13,953 bytes | 2026-10-11 17:51 |
| frontend/dashboard/js/modules/xp-gain.js | .js | 4,648 bytes | 2026-10-11 01:18 |
| frontend/dashboard/js/render.js | .js | 2,672 bytes | 2026-10-11 01:27 |
| frontend/dashboard/js/sw-cleanup.js | .js | 390 bytes | 2026-10-12 22:50 |
| frontend/dashboard/js/sw-killer.js | .js | 743 bytes | 2026-10-12 22:56 |
| frontend/dashboard/js/toast-dedupe.js | .js | 843 bytes | 2026-10-12 23:21 |
| frontend/dashboard/manifest.webmanifest | .webmanifest | 1,035 bytes | 2026-10-11 01:32 |
| frontend/dashboard/sessions.html | .html | 12,094 bytes | 2026-10-11 01:33 |
| frontend/dashboard/stats.ps1 | .ps1 | 3,635 bytes | 2026-10-11 01:25 |
| frontend/games/attention/flanker/config.json | .json | 653 bytes | 2026-09-22 22:00 |
| frontend/games/attention/flanker/flanker-extra-modes.js | .js | 22,527 bytes | 2026-09-23 02:52 |
| frontend/games/attention/flanker/flanker-helpers.js | .js | 14,546 bytes | 2026-09-23 01:26 |
| frontend/games/attention/flanker/flanker-sounds.js | .js | 3,390 bytes | 2026-09-23 01:17 |
| frontend/games/attention/flanker/flanker-stages.js | .js | 2,264 bytes | 2026-09-23 02:45 |
| frontend/games/attention/flanker/flanker-tutorial.js | .js | 9,258 bytes | 2026-09-23 01:18 |
| frontend/games/attention/flanker/game.css | .css | 32,188 bytes | 2026-09-23 02:52 |
| frontend/games/attention/flanker/game.html | .html | 3,449 bytes | 2026-09-24 03:02 |
| frontend/games/attention/flanker/game.js | .js | 70,122 bytes | 2026-09-24 03:02 |
| frontend/games/attention/go-no-go.legacy/config.json | .json | 290 bytes | 2026-09-22 01:44 |
| frontend/games/attention/go-no-go.legacy/game.css | .css | 30,240 bytes | 2026-09-23 02:24 |
| frontend/games/attention/go-no-go.legacy/game.html | .html | 1,957 bytes | 2026-09-23 02:38 |
| frontend/games/attention/go-no-go.legacy/game.js | .js | 50,362 bytes | 2026-09-23 02:29 |
| frontend/games/attention/go-no-go.legacy/gng-analytics.js | .js | 7,954 bytes | 2026-09-23 02:05 |
| frontend/games/attention/go-no-go.legacy/gng-ddm.js | .js | 6,576 bytes | 2026-09-23 02:03 |
| frontend/games/attention/go-no-go.legacy/gng-helpers.js | .js | 14,363 bytes | 2026-09-23 01:57 |
| frontend/games/attention/go-no-go.legacy/gng-modes.js | .js | 22,144 bytes | 2026-09-23 02:31 |
| frontend/games/attention/go-no-go.legacy/gng-sounds.js | .js | 4,761 bytes | 2026-09-23 02:02 |
| frontend/games/attention/go-no-go.legacy/gng-stages.js | .js | 2,164 bytes | 2026-09-23 02:20 |
| frontend/games/attention/go-no-go/config.json | .json | 869 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/game.css | .css | 6,216 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/game.html | .html | 1,927 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/game.js | .js | 11,852 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/go-no-go-extra-modes.js | .js | 1,305 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/go-no-go-helpers.js | .js | 8,968 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/go-no-go-sounds.js | .js | 1,321 bytes | 2026-10-09 23:25 |
| frontend/games/attention/go-no-go/go-no-go-stages.js | .js | 1,629 bytes | 2026-10-09 23:25 |
| frontend/games/attention/task-switching/config.json | .json | 297 bytes | 2026-09-22 02:51 |
| frontend/games/attention/task-switching/game.css | .css | 28,964 bytes | 2026-09-23 05:50 |
| frontend/games/attention/task-switching/game.html | .html | 3,535 bytes | 2026-09-23 05:49 |
| frontend/games/attention/task-switching/game.js | .js | 37,749 bytes | 2026-09-23 06:18 |
| frontend/games/attention/task-switching/task-switching-extra-modes.js | .js | 28,517 bytes | 2026-09-23 05:50 |
| frontend/games/attention/task-switching/task-switching-helpers.js | .js | 12,995 bytes | 2026-09-23 05:48 |
| frontend/games/attention/task-switching/task-switching-sounds.js | .js | 4,061 bytes | 2026-10-06 03:53 |
| frontend/games/attention/task-switching/task-switching-stages.js | .js | 2,184 bytes | 2026-10-06 11:29 |
| frontend/games/attention/vigilance/config.json | .json | 670 bytes | 2026-10-02 14:44 |
| frontend/games/attention/vigilance/game.css | .css | 25,635 bytes | 2026-10-02 14:50 |
| frontend/games/attention/vigilance/game.html | .html | 2,196 bytes | 2026-10-02 14:49 |
| frontend/games/attention/vigilance/game.js | .js | 32,245 bytes | 2026-10-02 14:53 |
| frontend/games/attention/vigilance/vigilance-extra-modes.js | .js | 20,622 bytes | 2026-10-02 14:52 |
| frontend/games/attention/vigilance/vigilance-helpers.js | .js | 13,365 bytes | 2026-10-02 14:46 |
| frontend/games/attention/vigilance/vigilance-sounds.js | .js | 3,879 bytes | 2026-10-02 14:48 |
| frontend/games/attention/vigilance/vigilance-stages.js | .js | 2,155 bytes | 2026-10-02 14:47 |
| frontend/games/creativity/alternative-uses/alternative-uses-extra-modes.js | .js | 19,195 bytes | 2026-09-23 07:08 |
| frontend/games/creativity/alternative-uses/alternative-uses-helpers.js | .js | 12,881 bytes | 2026-09-23 07:04 |
| frontend/games/creativity/alternative-uses/alternative-uses-sounds.js | .js | 3,736 bytes | 2026-09-23 07:05 |
| frontend/games/creativity/alternative-uses/alternative-uses-stages.js | .js | 2,160 bytes | 2026-09-23 07:05 |
| frontend/games/creativity/alternative-uses/config.json | .json | 306 bytes | 2026-09-22 02:31 |
| frontend/games/creativity/alternative-uses/game.css | .css | 29,460 bytes | 2026-09-23 07:07 |
| frontend/games/creativity/alternative-uses/game.html | .html | 3,392 bytes | 2026-09-23 07:06 |
| frontend/games/creativity/alternative-uses/game.js | .js | 40,220 bytes | 2026-09-23 07:09 |
| frontend/games/creativity/creative-connect/config.json | .json | 312 bytes | 2026-09-22 02:34 |
| frontend/games/creativity/creative-connect/creative-connect-extra-modes.js | .js | 19,304 bytes | 2026-09-24 02:33 |
| frontend/games/creativity/creative-connect/creative-connect-helpers.js | .js | 12,863 bytes | 2026-09-24 02:30 |
| frontend/games/creativity/creative-connect/creative-connect-sounds.js | .js | 4,066 bytes | 2026-10-06 03:54 |
| frontend/games/creativity/creative-connect/creative-connect-stages.js | .js | 2,184 bytes | 2026-09-24 02:31 |
| frontend/games/creativity/creative-connect/game.css | .css | 29,567 bytes | 2026-09-24 02:32 |
| frontend/games/creativity/creative-connect/game.html | .html | 3,475 bytes | 2026-09-24 02:32 |
| frontend/games/creativity/creative-connect/game.js | .js | 47,849 bytes | 2026-09-24 02:35 |
| frontend/games/creativity/idea-flow/config.json | .json | 292 bytes | 2026-09-22 02:56 |
| frontend/games/creativity/idea-flow/game.css | .css | 25,393 bytes | 2026-10-02 13:38 |
| frontend/games/creativity/idea-flow/game.html | .html | 2,196 bytes | 2026-10-02 13:38 |
| frontend/games/creativity/idea-flow/game.js | .js | 32,684 bytes | 2026-10-02 14:18 |
| frontend/games/creativity/idea-flow/idea-flow-extra-modes.js | .js | 5,713 bytes | 2026-10-11 17:47 |
| frontend/games/creativity/idea-flow/idea-flow-helpers.js | .js | 7,255 bytes | 2026-10-11 17:46 |
| frontend/games/creativity/idea-flow/idea-flow-sounds.js | .js | 2,960 bytes | 2026-10-11 17:46 |
| frontend/games/creativity/idea-flow/idea-flow-stages.js | .js | 1,785 bytes | 2026-10-11 17:47 |
| frontend/games/creativity/story-spark/config.json | .json | 285 bytes | 2026-09-22 02:37 |
| frontend/games/creativity/story-spark/game.css | .css | 24,535 bytes | 2026-09-24 02:56 |
| frontend/games/creativity/story-spark/game.html | .html | 2,206 bytes | 2026-09-24 02:54 |
| frontend/games/creativity/story-spark/game.js | .js | 33,689 bytes | 2026-09-24 02:58 |
| frontend/games/creativity/story-spark/story-spark-extra-modes.js | .js | 16,888 bytes | 2026-09-24 02:56 |
| frontend/games/creativity/story-spark/story-spark-helpers.js | .js | 12,899 bytes | 2026-09-24 02:50 |
| frontend/games/creativity/story-spark/story-spark-sounds.js | .js | 4,046 bytes | 2026-09-24 02:51 |
| frontend/games/creativity/story-spark/story-spark-stages.js | .js | 2,174 bytes | 2026-09-24 02:51 |
| frontend/games/emotional/empathy-engine/config.json | .json | 305 bytes | 2026-09-22 03:14 |
| frontend/games/emotional/empathy-engine/empathy-engine-extra-modes.js | .js | 16,432 bytes | 2026-09-24 03:01 |
| frontend/games/emotional/empathy-engine/empathy-engine-helpers.js | .js | 12,364 bytes | 2026-10-02 10:12 |
| frontend/games/emotional/empathy-engine/empathy-engine-sounds.js | .js | 3,980 bytes | 2026-10-02 10:12 |
| frontend/games/emotional/empathy-engine/empathy-engine-stages.js | .js | 2,163 bytes | 2026-09-24 03:00 |
| frontend/games/emotional/empathy-engine/game.css | .css | 25,912 bytes | 2026-09-30 16:14 |
| frontend/games/emotional/empathy-engine/game.html | .html | 2,221 bytes | 2026-09-30 16:14 |
| frontend/games/emotional/empathy-engine/game.js | .js | 39,170 bytes | 2026-09-30 16:14 |
| frontend/games/emotional/micro-expressions/config.json | .json | 301 bytes | 2026-09-22 03:09 |
| frontend/games/emotional/micro-expressions/game.css | .css | 24,595 bytes | 2026-10-01 06:04 |
| frontend/games/emotional/micro-expressions/game.html | .html | 2,236 bytes | 2026-10-01 06:04 |
| frontend/games/emotional/micro-expressions/game.js | .js | 35,670 bytes | 2026-10-01 06:06 |
| frontend/games/emotional/micro-expressions/micro-expressions-extra-modes.js | .js | 20,845 bytes | 2026-10-01 06:05 |
| frontend/games/emotional/micro-expressions/micro-expressions-helpers.js | .js | 12,452 bytes | 2026-10-02 10:08 |
| frontend/games/emotional/micro-expressions/micro-expressions-sounds.js | .js | 4,050 bytes | 2026-10-02 10:08 |
| frontend/games/emotional/micro-expressions/micro-expressions-stages.js | .js | 2,178 bytes | 2026-10-01 06:01 |
| frontend/games/emotional/social-read/config.json | .json | 293 bytes | 2026-09-22 04:23 |
| frontend/games/emotional/social-read/game.css | .css | 25,959 bytes | 2026-10-01 06:13 |
| frontend/games/emotional/social-read/game.html | .html | 2,206 bytes | 2026-10-01 06:13 |
| frontend/games/emotional/social-read/game.js | .js | 43,410 bytes | 2026-10-01 06:14 |
| frontend/games/emotional/social-read/social-read-extra-modes.js | .js | 16,363 bytes | 2026-10-01 06:13 |
| frontend/games/emotional/social-read/social-read-helpers.js | .js | 12,503 bytes | 2026-10-02 10:09 |
| frontend/games/emotional/social-read/social-read-sounds.js | .js | 3,974 bytes | 2026-10-02 10:09 |
| frontend/games/emotional/social-read/social-read-stages.js | .js | 2,172 bytes | 2026-10-01 06:12 |
| frontend/games/emotional/tone-detector/config.json | .json | 298 bytes | 2026-09-22 03:12 |
| frontend/games/emotional/tone-detector/game.css | .css | 26,295 bytes | 2026-10-02 10:22 |
| frontend/games/emotional/tone-detector/game.html | .html | 2,216 bytes | 2026-10-02 10:21 |
| frontend/games/emotional/tone-detector/game.js | .js | 37,818 bytes | 2026-10-02 10:23 |
| frontend/games/emotional/tone-detector/tone-detector-extra-modes.js | .js | 16,576 bytes | 2026-10-02 10:20 |
| frontend/games/emotional/tone-detector/tone-detector-helpers.js | .js | 12,424 bytes | 2026-10-02 10:18 |
| frontend/games/emotional/tone-detector/tone-detector-sounds.js | .js | 3,937 bytes | 2026-10-02 10:19 |
| frontend/games/emotional/tone-detector/tone-detector-stages.js | .js | 2,167 bytes | 2026-10-02 10:19 |
| frontend/games/language/lexical-decision/config.json | .json | 292 bytes | 2026-09-22 02:21 |
| frontend/games/language/lexical-decision/game.css | .css | 26,341 bytes | 2026-10-04 00:57 |
| frontend/games/language/lexical-decision/game.html | .html | 2,231 bytes | 2026-10-04 00:57 |
| frontend/games/language/lexical-decision/game.js | .js | 38,969 bytes | 2026-10-04 01:01 |
| frontend/games/language/lexical-decision/lexical-decision-extra-modes.js | .js | 19,378 bytes | 2026-10-04 00:57 |
| frontend/games/language/lexical-decision/lexical-decision-helpers.js | .js | 13,686 bytes | 2026-10-04 00:55 |
| frontend/games/language/lexical-decision/lexical-decision-sounds.js | .js | 4,154 bytes | 2026-10-04 00:56 |
| frontend/games/language/lexical-decision/lexical-decision-stages.js | .js | 2,224 bytes | 2026-10-04 00:56 |
| frontend/games/language/verbal-analogies/config.json | .json | 1,030 bytes | 2026-10-04 02:44 |
| frontend/games/language/verbal-analogies/game.css | .css | 27,426 bytes | 2026-10-04 02:42 |
| frontend/games/language/verbal-analogies/game.html | .html | 2,250 bytes | 2026-10-04 02:42 |
| frontend/games/language/verbal-analogies/game.js | .js | 44,072 bytes | 2026-10-04 02:44 |
| frontend/games/language/verbal-analogies/verbal-analogies-extra-modes.js | .js | 21,121 bytes | 2026-10-04 02:43 |
| frontend/games/language/verbal-analogies/verbal-analogies-helpers.js | .js | 12,736 bytes | 2026-10-04 02:41 |
| frontend/games/language/verbal-analogies/verbal-analogies-sounds.js | .js | 4,556 bytes | 2026-10-04 02:42 |
| frontend/games/language/verbal-analogies/verbal-analogies-stages.js | .js | 2,187 bytes | 2026-10-04 02:42 |
| frontend/games/language/vocabulary-elite/config.json | .json | 784 bytes | 2026-10-04 02:40 |
| frontend/games/language/vocabulary-elite/game.css | .css | 26,105 bytes | 2026-10-04 02:39 |
| frontend/games/language/vocabulary-elite/game.html | .html | 2,250 bytes | 2026-10-04 02:39 |
| frontend/games/language/vocabulary-elite/game.js | .js | 36,596 bytes | 2026-10-04 02:40 |
| frontend/games/language/vocabulary-elite/vocabulary-elite-extra-modes.js | .js | 20,615 bytes | 2026-10-04 02:39 |
| frontend/games/language/vocabulary-elite/vocabulary-elite-helpers.js | .js | 12,699 bytes | 2026-10-04 02:38 |
| frontend/games/language/vocabulary-elite/vocabulary-elite-sounds.js | .js | 4,557 bytes | 2026-10-04 02:38 |
| frontend/games/language/vocabulary-elite/vocabulary-elite-stages.js | .js | 2,182 bytes | 2026-10-04 02:38 |
| frontend/games/language/word-scramble/config.json | .json | 847 bytes | 2026-10-04 02:47 |
| frontend/games/language/word-scramble/game.css | .css | 27,587 bytes | 2026-10-04 02:46 |
| frontend/games/language/word-scramble/game.html | .html | 2,235 bytes | 2026-10-04 02:45 |
| frontend/games/language/word-scramble/game.js | .js | 45,804 bytes | 2026-10-04 02:47 |
| frontend/games/language/word-scramble/word-scramble-extra-modes.js | .js | 24,921 bytes | 2026-10-04 02:46 |
| frontend/games/language/word-scramble/word-scramble-helpers.js | .js | 12,911 bytes | 2026-10-04 02:45 |
| frontend/games/language/word-scramble/word-scramble-sounds.js | .js | 4,990 bytes | 2026-10-04 02:45 |
| frontend/games/language/word-scramble/word-scramble-stages.js | .js | 2,161 bytes | 2026-10-04 02:45 |
| frontend/games/logic/argument-analyzer/argument-analyzer-extra-modes.js | .js | 19,903 bytes | 2026-10-04 02:35 |
| frontend/games/logic/argument-analyzer/argument-analyzer-helpers.js | .js | 12,757 bytes | 2026-10-04 02:34 |
| frontend/games/logic/argument-analyzer/argument-analyzer-sounds.js | .js | 4,499 bytes | 2026-10-04 02:34 |
| frontend/games/logic/argument-analyzer/argument-analyzer-stages.js | .js | 2,131 bytes | 2026-10-11 17:43 |
| frontend/games/logic/argument-analyzer/config.json | .json | 869 bytes | 2026-10-04 02:37 |
| frontend/games/logic/argument-analyzer/game.css | .css | 25,749 bytes | 2026-10-04 02:35 |
| frontend/games/logic/argument-analyzer/game.html | .html | 2,255 bytes | 2026-10-04 02:35 |
| frontend/games/logic/argument-analyzer/game.js | .js | 43,451 bytes | 2026-10-04 02:37 |
| frontend/games/logic/deduction/config.json | .json | 612 bytes | 2026-10-02 22:30 |
| frontend/games/logic/deduction/deduction-extra-modes.js | .js | 17,937 bytes | 2026-10-02 22:33 |
| frontend/games/logic/deduction/deduction-helpers.js | .js | 11,427 bytes | 2026-10-02 22:31 |
| frontend/games/logic/deduction/deduction-sounds.js | .js | 4,079 bytes | 2026-10-02 22:31 |
| frontend/games/logic/deduction/deduction-stages.js | .js | 2,178 bytes | 2026-10-02 22:32 |
| frontend/games/logic/deduction/game.css | .css | 26,559 bytes | 2026-10-02 22:32 |
| frontend/games/logic/deduction/game.html | .html | 2,203 bytes | 2026-10-02 22:32 |
| frontend/games/logic/deduction/game.js | .js | 38,045 bytes | 2026-10-02 22:34 |
| frontend/games/logic/matrix-logic/config.json | .json | 649 bytes | 2026-10-02 14:18 |
| frontend/games/logic/matrix-logic/game.css | .css | 25,736 bytes | 2026-10-02 14:21 |
| frontend/games/logic/matrix-logic/game.html | .html | 2,211 bytes | 2026-10-02 14:21 |
| frontend/games/logic/matrix-logic/game.js | .js | 38,929 bytes | 2026-10-02 14:24 |
| frontend/games/logic/matrix-logic/matrix-logic-extra-modes.js | .js | 18,190 bytes | 2026-10-02 14:23 |
| frontend/games/logic/matrix-logic/matrix-logic-helpers.js | .js | 12,534 bytes | 2026-10-02 14:19 |
| frontend/games/logic/matrix-logic/matrix-logic-sounds.js | .js | 3,935 bytes | 2026-10-02 14:20 |
| frontend/games/logic/matrix-logic/matrix-logic-stages.js | .js | 2,173 bytes | 2026-10-02 14:20 |
| frontend/games/logic/syllogisms/config.json | .json | 647 bytes | 2026-10-02 22:24 |
| frontend/games/logic/syllogisms/game.css | .css | 28,260 bytes | 2026-10-02 22:27 |
| frontend/games/logic/syllogisms/game.html | .html | 2,201 bytes | 2026-10-02 22:29 |
| frontend/games/logic/syllogisms/game.js | .js | 38,022 bytes | 2026-10-02 22:28 |
| frontend/games/logic/syllogisms/syllogisms-extra-modes.js | .js | 18,446 bytes | 2026-10-02 22:28 |
| frontend/games/logic/syllogisms/syllogisms-helpers.js | .js | 12,519 bytes | 2026-10-02 22:25 |
| frontend/games/logic/syllogisms/syllogisms-sounds.js | .js | 4,163 bytes | 2026-10-02 22:25 |
| frontend/games/logic/syllogisms/syllogisms-stages.js | .js | 2,157 bytes | 2026-10-02 22:25 |
| frontend/games/logic/truth-tbl/config.json | .json | 281 bytes | 2026-09-22 01:13 |
| frontend/games/logic/truth-tbl/game.css | .css | 17,684 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/game.html | .html | 1,900 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/game.js | .js | 14,557 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/truth-tbl-extra-modes.js | .js | 1,715 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/truth-tbl-helpers.js | .js | 8,279 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/truth-tbl-sounds.js | .js | 1,511 bytes | 2026-10-11 02:09 |
| frontend/games/logic/truth-tbl/truth-tbl-stages.js | .js | 1,697 bytes | 2026-10-11 02:09 |
| frontend/games/memory/face-match/config.json | .json | 627 bytes | 2026-10-02 22:10 |
| frontend/games/memory/face-match/face-match-extra-modes.js | .js | 16,585 bytes | 2026-10-02 22:14 |
| frontend/games/memory/face-match/face-match-helpers.js | .js | 11,775 bytes | 2026-10-02 22:10 |
| frontend/games/memory/face-match/face-match-sounds.js | .js | 4,121 bytes | 2026-10-02 22:11 |
| frontend/games/memory/face-match/face-match-stages.js | .js | 2,170 bytes | 2026-10-02 22:11 |
| frontend/games/memory/face-match/game.css | .css | 26,776 bytes | 2026-10-06 11:38 |
| frontend/games/memory/face-match/game.html | .html | 2,201 bytes | 2026-10-02 22:12 |
| frontend/games/memory/face-match/game.js | .js | 39,289 bytes | 2026-10-02 22:15 |
| frontend/games/memory/flash-cards/config.json | .json | 251 bytes | 2026-09-22 00:41 |
| frontend/games/memory/flash-cards/flash-cards-extra-modes.js | .js | 1,856 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/flash-cards-helpers.js | .js | 8,224 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/flash-cards-sounds.js | .js | 1,511 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/flash-cards-stages.js | .js | 1,690 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/game.css | .css | 9,325 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/game.html | .html | 1,905 bytes | 2026-10-11 02:08 |
| frontend/games/memory/flash-cards/game.js | .js | 13,399 bytes | 2026-10-11 02:08 |
| frontend/games/memory/n-back/config.json | .json | 647 bytes | 2026-10-02 15:01 |
| frontend/games/memory/n-back/game.css | .css | 26,442 bytes | 2026-10-02 15:04 |
| frontend/games/memory/n-back/game.html | .html | 2,181 bytes | 2026-10-02 15:03 |
| frontend/games/memory/n-back/game.js | .js | 33,270 bytes | 2026-10-02 15:05 |
| frontend/games/memory/n-back/n-back-extra-modes.js | .js | 19,196 bytes | 2026-10-02 15:05 |
| frontend/games/memory/n-back/n-back-helpers.js | .js | 13,524 bytes | 2026-10-02 15:02 |
| frontend/games/memory/n-back/n-back-sounds.js | .js | 3,998 bytes | 2026-10-02 15:02 |
| frontend/games/memory/n-back/n-back-stages.js | .js | 2,166 bytes | 2026-10-02 15:02 |
| frontend/games/memory/pattern-recall/config.json | .json | 613 bytes | 2026-10-03 20:51 |
| frontend/games/memory/pattern-recall/game.css | .css | 22,933 bytes | 2026-10-03 21:25 |
| frontend/games/memory/pattern-recall/game.html | .html | 2,220 bytes | 2026-10-03 21:25 |
| frontend/games/memory/pattern-recall/game.js | .js | 29,984 bytes | 2026-10-03 21:28 |
| frontend/games/memory/pattern-recall/pattern-recall-extra-modes.js | .js | 16,339 bytes | 2026-10-03 21:25 |
| frontend/games/memory/pattern-recall/pattern-recall-helpers.js | .js | 11,837 bytes | 2026-10-03 20:51 |
| frontend/games/memory/pattern-recall/pattern-recall-sounds.js | .js | 4,088 bytes | 2026-10-03 20:52 |
| frontend/games/memory/pattern-recall/pattern-recall-stages.js | .js | 2,191 bytes | 2026-10-03 20:52 |
| frontend/games/memory/seq-mem/config.json | .json | 650 bytes | 2026-10-04 02:30 |
| frontend/games/memory/seq-mem/game.css | .css | 25,975 bytes | 2026-10-04 02:28 |
| frontend/games/memory/seq-mem/game.html | .html | 2,201 bytes | 2026-10-04 02:28 |
| frontend/games/memory/seq-mem/game.js | .js | 31,709 bytes | 2026-10-04 02:30 |
| frontend/games/memory/seq-mem/seq-mem-extra-modes.js | .js | 21,579 bytes | 2026-10-04 02:28 |
| frontend/games/memory/seq-mem/seq-mem-helpers.js | .js | 12,768 bytes | 2026-10-04 01:34 |
| frontend/games/memory/seq-mem/seq-mem-sounds.js | .js | 4,498 bytes | 2026-10-04 01:35 |
| frontend/games/memory/seq-mem/seq-mem-stages.js | .js | 2,149 bytes | 2026-10-04 01:36 |
| frontend/games/numerical/digit-span/config.json | .json | 283 bytes | 2026-09-22 01:26 |
| frontend/games/numerical/digit-span/digit-span-extra-modes.js | .js | 1,780 bytes | 2026-10-11 00:28 |
| frontend/games/numerical/digit-span/digit-span-helpers.js | .js | 8,184 bytes | 2026-10-11 00:28 |
| frontend/games/numerical/digit-span/digit-span-sounds.js | .js | 1,707 bytes | 2026-10-11 00:28 |
| frontend/games/numerical/digit-span/digit-span-stages.js | .js | 1,663 bytes | 2026-10-11 00:31 |
| frontend/games/numerical/digit-span/game.css | .css | 15,937 bytes | 2026-10-11 00:29 |
| frontend/games/numerical/digit-span/game.html | .html | 1,898 bytes | 2026-10-11 00:29 |
| frontend/games/numerical/digit-span/game.js | .js | 17,471 bytes | 2026-10-11 00:29 |
| frontend/games/numerical/mental-math/config.json | .json | 279 bytes | 2026-09-22 01:04 |
| frontend/games/numerical/mental-math/game.css | .css | 10,628 bytes | 2026-09-22 01:04 |
| frontend/games/numerical/mental-math/game.html | .html | 1,503 bytes | 2026-09-22 01:04 |
| frontend/games/numerical/mental-math/game.js | .js | 23,269 bytes | 2026-09-22 01:04 |
| frontend/games/numerical/mental-math/mental-math-extra-modes.js | .js | 10,564 bytes | 2026-10-11 17:44 |
| frontend/games/numerical/mental-math/mental-math-helpers.js | .js | 9,151 bytes | 2026-10-11 17:43 |
| frontend/games/numerical/mental-math/mental-math-sounds.js | .js | 3,397 bytes | 2026-10-11 17:43 |
| frontend/games/numerical/mental-math/mental-math-stages.js | .js | 2,084 bytes | 2026-10-11 17:43 |
| frontend/games/numerical/num-chains/config.json | .json | 291 bytes | 2026-09-22 01:08 |
| frontend/games/numerical/num-chains/game.css | .css | 12,156 bytes | 2026-09-22 01:08 |
| frontend/games/numerical/num-chains/game.html | .html | 1,505 bytes | 2026-09-22 01:08 |
| frontend/games/numerical/num-chains/game.js | .js | 28,240 bytes | 2026-09-22 01:08 |
| frontend/games/numerical/num-chains/num-chains-extra-modes.js | .js | 6,191 bytes | 2026-10-11 17:45 |
| frontend/games/numerical/num-chains/num-chains-helpers.js | .js | 7,689 bytes | 2026-10-11 17:44 |
| frontend/games/numerical/num-chains/num-chains-sounds.js | .js | 2,758 bytes | 2026-10-11 17:44 |
| frontend/games/numerical/num-chains/num-chains-stages.js | .js | 1,830 bytes | 2026-10-11 17:45 |
| frontend/games/numerical/speed-calc/config.json | .json | 288 bytes | 2026-09-22 01:09 |
| frontend/games/numerical/speed-calc/game.css | .css | 12,927 bytes | 2026-09-22 01:09 |
| frontend/games/numerical/speed-calc/game.html | .html | 1,737 bytes | 2026-09-22 01:09 |
| frontend/games/numerical/speed-calc/game.js | .js | 22,251 bytes | 2026-09-22 01:10 |
| frontend/games/numerical/speed-calc/speed-calc-extra-modes.js | .js | 6,159 bytes | 2026-10-11 17:45 |
| frontend/games/numerical/speed-calc/speed-calc-helpers.js | .js | 7,321 bytes | 2026-10-11 17:45 |
| frontend/games/numerical/speed-calc/speed-calc-sounds.js | .js | 2,750 bytes | 2026-10-11 17:45 |
| frontend/games/numerical/speed-calc/speed-calc-stages.js | .js | 1,869 bytes | 2026-10-11 17:45 |
| frontend/games/problem/gear-logic/config.json | .json | 614 bytes | 2026-10-02 14:37 |
| frontend/games/problem/gear-logic/game.css | .css | 25,584 bytes | 2026-10-02 14:39 |
| frontend/games/problem/gear-logic/game.html | .html | 2,201 bytes | 2026-10-02 14:38 |
| frontend/games/problem/gear-logic/game.js | .js | 34,766 bytes | 2026-10-02 14:41 |
| frontend/games/problem/gear-logic/gear-logic-extra-modes.js | .js | 17,984 bytes | 2026-10-02 14:40 |
| frontend/games/problem/gear-logic/gear-logic-helpers.js | .js | 12,139 bytes | 2026-10-02 14:37 |
| frontend/games/problem/gear-logic/gear-logic-sounds.js | .js | 4,084 bytes | 2026-10-02 14:37 |
| frontend/games/problem/gear-logic/gear-logic-stages.js | .js | 2,169 bytes | 2026-10-02 14:38 |
| frontend/games/problem/hanoi/config.json | .json | 615 bytes | 2026-10-02 14:31 |
| frontend/games/problem/hanoi/game.css | .css | 26,653 bytes | 2026-10-02 14:33 |
| frontend/games/problem/hanoi/game.html | .html | 2,185 bytes | 2026-10-02 14:33 |
| frontend/games/problem/hanoi/game.js | .js | 31,427 bytes | 2026-10-02 14:35 |
| frontend/games/problem/hanoi/hanoi-extra-modes.js | .js | 24,020 bytes | 2026-10-02 14:34 |
| frontend/games/problem/hanoi/hanoi-helpers.js | .js | 12,337 bytes | 2026-10-02 14:32 |
| frontend/games/problem/hanoi/hanoi-sounds.js | .js | 4,211 bytes | 2026-10-02 14:32 |
| frontend/games/problem/hanoi/hanoi-stages.js | .js | 2,175 bytes | 2026-10-02 14:32 |
| frontend/games/problem/path-finder/config.json | .json | 640 bytes | 2026-10-02 22:16 |
| frontend/games/problem/path-finder/game.css | .css | 25,240 bytes | 2026-10-02 22:19 |
| frontend/games/problem/path-finder/game.html | .html | 2,206 bytes | 2026-10-02 22:18 |
| frontend/games/problem/path-finder/game.js | .js | 32,885 bytes | 2026-10-02 22:21 |
| frontend/games/problem/path-finder/path-finder-extra-modes.js | .js | 17,319 bytes | 2026-10-02 22:20 |
| frontend/games/problem/path-finder/path-finder-helpers.js | .js | 11,967 bytes | 2026-10-02 22:17 |
| frontend/games/problem/path-finder/path-finder-sounds.js | .js | 4,250 bytes | 2026-10-02 22:17 |
| frontend/games/problem/path-finder/path-finder-stages.js | .js | 2,161 bytes | 2026-10-02 22:18 |
| frontend/games/problem/river-crossing/config.json | .json | 635 bytes | 2026-10-02 14:56 |
| frontend/games/problem/river-crossing/game.css | .css | 27,700 bytes | 2026-10-02 14:58 |
| frontend/games/problem/river-crossing/game.html | .html | 2,221 bytes | 2026-10-02 14:58 |
| frontend/games/problem/river-crossing/game.js | .js | 33,943 bytes | 2026-10-02 15:00 |
| frontend/games/problem/river-crossing/river-crossing-extra-modes.js | .js | 19,823 bytes | 2026-10-02 14:59 |
| frontend/games/problem/river-crossing/river-crossing-helpers.js | .js | 12,347 bytes | 2026-10-02 14:56 |
| frontend/games/problem/river-crossing/river-crossing-sounds.js | .js | 4,231 bytes | 2026-10-02 14:57 |
| frontend/games/problem/river-crossing/river-crossing-stages.js | .js | 2,185 bytes | 2026-10-02 14:57 |
| frontend/games/spatial/block-counter/block-counter-extra-modes.js | .js | 18,000 bytes | 2026-10-02 22:07 |
| frontend/games/spatial/block-counter/block-counter-helpers.js | .js | 12,020 bytes | 2026-10-02 22:04 |
| frontend/games/spatial/block-counter/block-counter-sounds.js | .js | 4,139 bytes | 2026-10-02 22:05 |
| frontend/games/spatial/block-counter/block-counter-stages.js | .js | 2,164 bytes | 2026-10-02 22:06 |
| frontend/games/spatial/block-counter/config.json | .json | 644 bytes | 2026-10-02 22:04 |
| frontend/games/spatial/block-counter/game.css | .css | 25,404 bytes | 2026-10-02 22:07 |
| frontend/games/spatial/block-counter/game.html | .html | 2,216 bytes | 2026-10-02 22:06 |
| frontend/games/spatial/block-counter/game.js | .js | 36,444 bytes | 2026-10-02 22:08 |
| frontend/games/spatial/corsi-blocks/config.json | .json | 630 bytes | 2026-10-02 15:18 |
| frontend/games/spatial/corsi-blocks/corsi-blocks-extra-modes.js | .js | 17,710 bytes | 2026-10-02 15:21 |
| frontend/games/spatial/corsi-blocks/corsi-blocks-helpers.js | .js | 11,840 bytes | 2026-10-02 15:18 |
| frontend/games/spatial/corsi-blocks/corsi-blocks-sounds.js | .js | 4,070 bytes | 2026-10-02 15:19 |
| frontend/games/spatial/corsi-blocks/corsi-blocks-stages.js | .js | 2,149 bytes | 2026-10-02 15:19 |
| frontend/games/spatial/corsi-blocks/game.css | .css | 25,137 bytes | 2026-10-02 15:20 |
| frontend/games/spatial/corsi-blocks/game.html | .html | 2,211 bytes | 2026-10-02 15:20 |
| frontend/games/spatial/corsi-blocks/game.js | .js | 30,107 bytes | 2026-10-02 15:21 |
| frontend/games/spatial/map-memory/config.json | .json | 655 bytes | 2026-10-02 21:58 |
| frontend/games/spatial/map-memory/game.css | .css | 26,382 bytes | 2026-10-02 22:02 |
| frontend/games/spatial/map-memory/game.html | .html | 2,201 bytes | 2026-10-02 22:01 |
| frontend/games/spatial/map-memory/game.js | .js | 32,692 bytes | 2026-10-02 22:03 |
| frontend/games/spatial/map-memory/map-memory-extra-modes.js | .js | 19,178 bytes | 2026-10-02 22:02 |
| frontend/games/spatial/map-memory/map-memory-helpers.js | .js | 11,975 bytes | 2026-10-02 21:58 |
| frontend/games/spatial/map-memory/map-memory-sounds.js | .js | 4,098 bytes | 2026-10-02 21:59 |
| frontend/games/spatial/map-memory/map-memory-stages.js | .js | 2,175 bytes | 2026-10-02 21:59 |
| frontend/games/spatial/mental-rotation/config.json | .json | 687 bytes | 2026-10-02 14:26 |
| frontend/games/spatial/mental-rotation/game.css | .css | 25,770 bytes | 2026-10-02 14:28 |
| frontend/games/spatial/mental-rotation/game.html | .html | 2,226 bytes | 2026-10-02 14:28 |
| frontend/games/spatial/mental-rotation/game.js | .js | 36,604 bytes | 2026-10-02 14:30 |
| frontend/games/spatial/mental-rotation/mental-rotation-extra-modes.js | .js | 18,161 bytes | 2026-10-02 14:29 |
| frontend/games/spatial/mental-rotation/mental-rotation-helpers.js | .js | 13,155 bytes | 2026-10-02 14:27 |
| frontend/games/spatial/mental-rotation/mental-rotation-sounds.js | .js | 3,941 bytes | 2026-10-02 14:27 |
| frontend/games/spatial/mental-rotation/mental-rotation-stages.js | .js | 2,184 bytes | 2026-10-02 14:28 |
| frontend/games/speed/color-match/color-match-extra-modes.js | .js | 17,221 bytes | 2026-10-04 01:29 |
| frontend/games/speed/color-match/color-match-helpers.js | .js | 13,660 bytes | 2026-10-04 01:27 |
| frontend/games/speed/color-match/color-match-sounds.js | .js | 4,339 bytes | 2026-10-04 01:28 |
| frontend/games/speed/color-match/color-match-stages.js | .js | 2,316 bytes | 2026-10-04 01:28 |
| frontend/games/speed/color-match/config.json | .json | 386 bytes | 2026-10-04 01:30 |
| frontend/games/speed/color-match/game.css | .css | 26,441 bytes | 2026-10-04 01:29 |
| frontend/games/speed/color-match/game.html | .html | 2,206 bytes | 2026-10-04 01:28 |
| frontend/games/speed/color-match/game.js | .js | 36,497 bytes | 2026-10-04 01:30 |
| frontend/games/speed/rapid-fire/config.json | .json | 361 bytes | 2026-10-04 01:20 |
| frontend/games/speed/rapid-fire/game.css | .css | 27,147 bytes | 2026-10-04 01:17 |
| frontend/games/speed/rapid-fire/game.html | .html | 2,201 bytes | 2026-10-04 01:17 |
| frontend/games/speed/rapid-fire/game.js | .js | 40,797 bytes | 2026-10-04 01:20 |
| frontend/games/speed/rapid-fire/rapid-fire-extra-modes.js | .js | 17,412 bytes | 2026-10-04 01:18 |
| frontend/games/speed/rapid-fire/rapid-fire-helpers.js | .js | 13,563 bytes | 2026-10-04 01:16 |
| frontend/games/speed/rapid-fire/rapid-fire-sounds.js | .js | 4,248 bytes | 2026-10-04 01:16 |
| frontend/games/speed/rapid-fire/rapid-fire-stages.js | .js | 2,224 bytes | 2026-10-04 01:17 |
| frontend/games/speed/reaction/config.json | .json | 300 bytes | 2026-10-04 01:33 |
| frontend/games/speed/reaction/game.css | .css | 26,625 bytes | 2026-10-04 01:32 |
| frontend/games/speed/reaction/game.html | .html | 2,189 bytes | 2026-10-04 01:32 |
| frontend/games/speed/reaction/game.js | .js | 27,976 bytes | 2026-10-04 01:33 |
| frontend/games/speed/reaction/reaction-extra-modes.js | .js | 18,454 bytes | 2026-10-04 01:32 |
| frontend/games/speed/reaction/reaction-helpers.js | .js | 13,316 bytes | 2026-10-04 01:31 |
| frontend/games/speed/reaction/reaction-sounds.js | .js | 4,442 bytes | 2026-10-04 01:31 |
| frontend/games/speed/reaction/reaction-stages.js | .js | 2,287 bytes | 2026-10-04 01:31 |
| frontend/games/speed/symbol-sprint/config.json | .json | 377 bytes | 2026-10-04 01:23 |
| frontend/games/speed/symbol-sprint/game.css | .css | 25,187 bytes | 2026-10-04 01:22 |
| frontend/games/speed/symbol-sprint/game.html | .html | 2,216 bytes | 2026-10-04 01:22 |
| frontend/games/speed/symbol-sprint/game.js | .js | 36,371 bytes | 2026-10-04 01:23 |
| frontend/games/speed/symbol-sprint/symbol-sprint-extra-modes.js | .js | 18,207 bytes | 2026-10-04 01:22 |
| frontend/games/speed/symbol-sprint/symbol-sprint-helpers.js | .js | 13,744 bytes | 2026-10-04 01:21 |
| frontend/games/speed/symbol-sprint/symbol-sprint-sounds.js | .js | 4,266 bytes | 2026-10-04 01:21 |
| frontend/games/speed/symbol-sprint/symbol-sprint-stages.js | .js | 2,310 bytes | 2026-10-04 01:21 |
| frontend/shared/flash-stages.js | .js | 6,320 bytes | 2026-09-24 00:49 |
| frontend/shared/i18n.js | .js | 15,874 bytes | 2026-09-24 00:43 |
| frontend/shared/settings.js | .js | 15,094 bytes | 2026-10-02 10:06 |
| frontend/shared/templates/create-game.bat | .bat | 1,534 bytes | 2026-10-06 03:50 |
| frontend/shared/templates/extra-modes.template.js | .js | 17,527 bytes | 2026-09-23 07:01 |
| frontend/shared/templates/game.template.html | .html | 3,473 bytes | 2026-10-09 00:07 |
| frontend/shared/templates/game.template.js | .js | 25,745 bytes | 2026-09-23 03:06 |
| frontend/shared/templates/helpers.template.js | .js | 10,049 bytes | 2026-09-23 03:11 |
| frontend/shared/templates/README.md | .md | 4,250 bytes | 2026-09-23 03:00 |
| frontend/shared/templates/stages.template.js | .js | 2,364 bytes | 2026-09-23 03:05 |
| motion-lab/dashboard.html | .html | 29,059 bytes | 2026-10-09 21:00 |
| motion-lab/login.html | .html | 22,636 bytes | 2026-10-09 20:54 |
| motion-lab/logo.html | .html | 15,961 bytes | 2026-10-09 20:57 |
| motion-lab/shared/logo.js | .js | 13,842 bytes | 2026-10-09 20:59 |
| PROJECT_SCAN_2026-10-12_23-09.txt | .txt | 7,703 bytes | 2026-10-12 23:09 |
| PROJECT_TREE.ps1 | .ps1 | 3,238 bytes | 2026-10-07 15:31 |
| PROJECT_TREE_COMPLETE.md | .md | 53,032 bytes | 2026-10-09 21:33 |
| stats.ps1 | .ps1 | 5,513 bytes | 2026-10-11 01:30 |
| verify-error-system.ps1 | .ps1 | 3,839 bytes | 2026-10-11 18:06 |
| verify-games.ps1 | .ps1 | 2,766 bytes | 2026-10-11 17:48 |

## Summary

- Total included files: 846
- Total included directories: 118
- Total included size: 7.41 MB

## Important Notes

This report describes the project structure and file metadata. It does not contain the full source code or the actual contents of documentation files.
Dependency folders and generated artifacts were excluded according to the exclusion rules in the PowerShell script.

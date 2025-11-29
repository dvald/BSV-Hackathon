<template>
  <div class="token-card">
    <div class="token-card-header">
      <div class="token-icon">
        <span>{{ token.symbol ? token.symbol.substring(0, 1).toUpperCase() : '?' }}</span>
      </div>
      <div class="token-info-header">
        <h5 class="token-name">{{ token.name }}</h5>
        <span class="token-symbol">{{ token.symbol }}</span>
      </div>
    </div>
    
    <div class="token-card-body">
      <div class="token-detail-row">
        <span class="detail-label">ID</span>
        <span class="detail-value mono" :title="token.id">{{ formatId(token.id) }}</span>
      </div>
      
      <div class="token-detail-row">
        <span class="detail-label">Supply</span>
        <span class="detail-value">{{ formatAmount(token.totalSupply, token.decimals) }}</span>
      </div>
      
      <div v-if="token.balance !== undefined" class="token-balance-section">
        <span class="detail-label">Your Balance</span>
        <div class="balance-value">{{ formatAmount(token.balance, token.decimals) }}</div>
      </div>
    </div>
    
    <div class="token-card-actions" v-if="$slots.actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'TokenCard',
  props: {
    token: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatAmount(amount: number, decimals: number) {
      if (amount === undefined || amount === null) return '0';
      return (amount / Math.pow(10, decimals)).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
    },
    formatId(id: string) {
        if (!id) return '';
        return id.substring(0, 8) + '...' + id.substring(id.length - 8);
    }
  }
});
</script>

<style scoped>
.token-card {
  background: var(--theme-card-bg, var(--bg-color-hard));
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--theme-border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.token-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.token-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color, #4f46e5), var(--secondary-color, #7c3aed));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.token-info-header {
  flex: 1;
  overflow: hidden;
}

.token-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-symbol {
  font-size: 0.85rem;
  color: var(--text-muted, #888);
  font-weight: 500;
}

.token-card-body {
  flex: 1;
}

.token-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.detail-label {
  color: var(--text-muted, #888);
}

.detail-value {
  color: var(--text-color);
  font-weight: 500;
}

.mono {
  font-family: monospace;
  background: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 4px;
}

.token-balance-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--theme-border-color);
}

.balance-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--success-color, #10b981);
  margin-top: 0.25rem;
}

.token-card-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;
}
</style>

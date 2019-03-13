import Vue from 'vue/dist/vue.js';

import PrescriptionForm from '../components/PrescriptionForm.vue';

function enable_sph_reading(frm) {
  frm.toggle_enable('sph_reading_right', frm.doc.add_type_right === '');
  frm.toggle_enable('sph_reading_left', frm.doc.add_type_left === '');
}

function handle_add_sph(side) {
  return function(frm) {
    frm.set_value(
      `sph_reading_${side}`,
      parseFloat(frm.doc[`sph_${side}`]) + parseFloat(frm.doc[`add_${side}`])
    );
  };
}

function toggle_detail_entry(frm, state) {
  frm.toggle_display('details_simple_sec', !state);
  frm.toggle_display(['details_sec', 'pd_sec', 'prism_sec', 'iop_sec'], state);
}

function calc_total_pd(frm) {
  const { pd_right = 0, pd_left = 0 } = frm.doc;
  frm.set_value('pd_total', parseFloat(pd_right) + parseFloat(pd_left));
}

function handle_va(side) {
  return async function(frm) {
    const field = `va_${side}`;
    const value = frm.doc[field];
    if (value) {
      await frm.set_value(field, value.replace(/[^0-9\/]*/g, ''));
    }
  };
}

export default {
  setup: async function(frm) {
    const { message: settings = {} } = await frappe.db.get_value(
      'Optical Store Settings',
      null,
      'prescription_entry'
    );
    toggle_detail_entry(frm, settings.prescription_entry === 'ERPNext');
  },
  onload: function(frm) {
    enable_sph_reading(frm);
    const { $wrapper } = frm.get_field('details_html');
    $wrapper.empty();
    if (frm.doc.__islocal) {
      // this makes the below fields reactive in vue
      frm.doc = Object.assign(frm.doc, {
        sph_reading_right: undefined,
        sph_reading_left: undefined,
        va_right: undefined,
        va_left: undefined,
        pd_total: undefined,
      });
    }
    frm.detail_vue = new Vue({
      el: $wrapper.html('<div />').children()[0],
      data: { doc: frm.doc },
      render: function(h) {
        return h(PrescriptionForm, {
          props: {
            doc: this.doc,
            update: (field, value) => frm.set_value(field, value),
            fields: frm.fields_dict,
          },
        });
      },
    });
  },
  refresh: function(frm) {
    frm.detail_vue.doc = frm.doc;
  },
  sph_right: handle_add_sph('right'),
  sph_left: handle_add_sph('left'),
  va_right: handle_va('right'),
  va_left: handle_va('left'),
  add_right: handle_add_sph('right'),
  add_left: handle_add_sph('left'),
  add_type_right: enable_sph_reading,
  add_type_left: enable_sph_reading,
  pd_right: calc_total_pd,
  pd_left: calc_total_pd,
};
